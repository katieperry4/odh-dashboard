import { mockDashboardConfig, mockDscStatus } from '@odh-dashboard/internal/__mocks__';
import { DataScienceStackComponent } from '@odh-dashboard/plugin-core/areas';
import { asProductAdminUser } from '../../../utils/mockUsers';
import {
  subscriptionManagementPage,
  subscriptionsPage,
  authPoliciesPage,
} from '../../../pages/modelsAsAService';
import {
  mockSubscriptions,
  mockAuthPolicies,
  mockSubscriptionFormData,
} from '../../../utils/maasUtils';

const setupCommonIntercepts = () => {
  asProductAdminUser();
  cy.interceptOdh(
    'GET /api/config',
    mockDashboardConfig({ modelAsService: true, maasSettingsIaRedesign: true }),
  );
  cy.interceptOdh('GET /maas/api/v1/user', {
    data: { userId: 'test-user', clusterAdmin: false },
  });
  cy.interceptOdh('GET /maas/api/v1/namespaces', { data: [] });
  cy.interceptOdh(
    'GET /api/dsc/status',
    mockDscStatus({
      components: {
        [DataScienceStackComponent.OGX_OPERATOR]: { managementState: 'Managed' },
      },
      conditions: [{ type: 'ModelsAsServiceReady', status: 'True', reason: 'Ready' }],
    }),
  );
  cy.interceptOdh('GET /maas/api/v1/subscription-policy-form-data', {
    data: mockSubscriptionFormData(),
  });
  cy.interceptOdh('GET /maas/api/v1/all-subscriptions', { data: mockSubscriptions() });
  cy.interceptOdh('GET /maas/api/v1/all-policies', { data: mockAuthPolicies() });
};

describe('Subscription Management Page', () => {
  beforeEach(() => {
    setupCommonIntercepts();
  });
  it('should show the overview empty state when there are no subscriptions, policies, or model refs', () => {
    cy.interceptOdh('GET /maas/api/v1/subscription-policy-form-data', {
      data: mockSubscriptionFormData({
        groups: [],
        modelRefs: [],
        subscriptions: [],
        policies: [],
      }),
    });
    subscriptionManagementPage.visit();
    subscriptionManagementPage.findOverviewEmptyState().should('exist');
    subscriptionManagementPage.findCreateSubscriptionButton().should('exist');
    subscriptionManagementPage.findCreateAuthPolicyButton().should('exist');
  });

  it('should show the subscriptions empty state when there are no subscriptions', () => {
    cy.interceptOdh('GET /maas/api/v1/all-subscriptions', { data: [] });
    subscriptionManagementPage.visit('subscriptions');
    subscriptionManagementPage.findSubscriptionsEmptyState().should('exist');
    subscriptionManagementPage.findCreateSubscriptionButton().should('exist');
  });

  it('should show the auth policies empty state when there are no policies', () => {
    cy.interceptOdh('GET /maas/api/v1/all-policies', { data: [] });
    subscriptionManagementPage.visit('auth-policies');
    subscriptionManagementPage.findAuthPoliciesEmptyState().should('exist');
    subscriptionManagementPage.findCreateAuthPolicyButton().should('exist');
  });

  it('should display the page with tabs and default to the overview tab', () => {
    subscriptionManagementPage.visit();
    subscriptionManagementPage.findTitle().should('contain.text', 'Subscription management');
    subscriptionManagementPage
      .findDescription()
      .should(
        'contain.text',
        'Manage subscriptions and authorization policies to control the MaaS models',
      );
    subscriptionManagementPage.findOverviewTab().should('have.attr', 'aria-selected', 'true');
    cy.contains('Subscription overview placeholder').should('exist');
  });

  it('should navigate between tabs and update the URL', () => {
    subscriptionManagementPage.visit();

    subscriptionManagementPage.findSubscriptionsTab().click();
    cy.url().should('include', '/subscription-management/subscriptions');
    subscriptionsPage.findTable().should('exist');
    subscriptionsPage.findRows().should('have.length', 6);

    subscriptionManagementPage.findAuthPoliciesTab().click();
    cy.url().should('include', '/subscription-management/auth-policies');
    authPoliciesPage.findTable().should('exist');
    authPoliciesPage.findRows().should('have.length', 6);

    subscriptionManagementPage.findOverviewTab().click();
    cy.url().should('include', '/subscription-management/overview');
    cy.contains('Subscription overview placeholder').should('exist');
  });

  it('should display subscriptions content within the subscriptions tab', () => {
    subscriptionManagementPage.visit('subscriptions');
    subscriptionsPage.findTable().should('exist');
    subscriptionsPage.findRows().should('have.length', 6);
    subscriptionsPage.findCreateSubscriptionButton().should('exist');

    subscriptionsPage.findFilterInput().type('premium');
    subscriptionsPage.findRows().should('have.length', 1);
    subscriptionsPage.findFilterResetButton().click();
    subscriptionsPage.findRows().should('have.length', 6);
  });

  it('should display auth policies content within the auth policies tab', () => {
    subscriptionManagementPage.visit('auth-policies');
    authPoliciesPage.findTable().should('exist');
    authPoliciesPage.findRows().should('have.length', 6);
    authPoliciesPage.findCreateAuthPolicyButton().should('exist');

    authPoliciesPage.findKeywordFilterInput().type('premium');
    authPoliciesPage.findRows().should('have.length', 1);
    authPoliciesPage.clearAllFilters();
    authPoliciesPage.findRows().should('have.length', 6);
  });
});
