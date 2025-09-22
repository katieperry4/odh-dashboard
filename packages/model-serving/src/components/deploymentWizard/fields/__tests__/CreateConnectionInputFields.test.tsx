import React, { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useWizardContext, useWizardFooter } from '@patternfly/react-core';
import { z } from 'zod';
import { renderHook } from '@odh-dashboard/jest-config/hooks';
import { mockK8sNameDescriptionFieldData } from '@odh-dashboard/internal/__mocks__/mockK8sNameDescriptionFieldData';
import {
  createConnectionDataSchema,
  CreateConnectionInputFields,
  isValidCreateConnectionData,
  useCreateConnectionData,
} from '../CreateConnectionInputFields';
import { ModelLocationType } from '../modelLocationFields/types';

const createConnectionInputFieldsSchema = z.object({
  createConnectionData: createConnectionDataSchema,
});

jest.mock('@patternfly/react-core', () => ({
  ...jest.requireActual('@patternfly/react-core'),
  useWizardContext: jest.fn(),
  useWizardFooter: jest.fn(),
}));
const mockUseWizardContext = useWizardContext as jest.MockedFunction<typeof useWizardContext>;
const mockUseWizardFooter = useWizardFooter as jest.MockedFunction<typeof useWizardFooter>;
const mockModelLocationData = {
  type: ModelLocationType.NEW,
  fieldValues: {
    URI: 'https://://test',
  },
  additionalFields: {},
};

describe('CreateConnectionInputFields', () => {
  const mockWizardContext = {
    activeStep: { index: 1, name: 'test-step', id: 'test-step', parentId: undefined },
    goToNextStep: jest.fn(),
    goToPrevStep: jest.fn(),
    close: jest.fn(),
    steps: [],
    footer: <div>Mock Footer</div>,
    goToStepById: jest.fn(),
    goToStepByName: jest.fn(),
    goToStepByIndex: jest.fn(),
    setFooter: jest.fn(),
    getStep: jest.fn(),
    setStep: jest.fn(),
    currentStepIndex: 1,
    hasBodyPadding: true,
    shouldFocusContent: true,
    mainWrapperRef: { current: null },
  };
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWizardContext.mockReturnValue(mockWizardContext);
    mockUseWizardFooter.mockImplementation(() => undefined);
  });
  describe('Schema validation', () => {
    it('should validate complete data', () => {
      const result = createConnectionInputFieldsSchema.safeParse({
        createConnectionData: { saveConnection: true, nameDesc: mockK8sNameDescriptionFieldData() },
      });
      expect(result.success).toBe(true);
    });
    it('should reject incomplete data', () => {
      const result = createConnectionInputFieldsSchema.safeParse({
        createConnectionData: { saveConnection: true },
      });
      expect(result.success).toBe(false);
    });
  });
  describe('isValidCreateConnectionData', () => {
    it('should return true if the connection data is valid', () => {
      expect(
        isValidCreateConnectionData({
          saveConnection: true,
          nameDesc: mockK8sNameDescriptionFieldData(),
        }),
      ).toBe(true);
    });
    it('should return false if the connection data is invalid', () => {
      expect(isValidCreateConnectionData({ saveConnection: true })).toBe(false);
    });
  });
  describe('useCreateConnectionData hook', () => {
    it('should return the correct data', () => {
      const { result } = renderHook(() =>
        useCreateConnectionData(null, {
          saveConnection: true,
          nameDesc: mockK8sNameDescriptionFieldData(),
        }),
      );
      const { data, setData } = result.current;
      expect(data).toEqual({
        saveConnection: true,
        nameDesc: mockK8sNameDescriptionFieldData(),
      });
      expect(setData).toBeDefined();
    });
    it('should return false if the connection data is invalid', () => {
      const { result } = renderHook(() => useCreateConnectionData(null, { saveConnection: true }));
      const { data, setData } = result.current;
      expect(data).toEqual({ saveConnection: true });
      expect(setData).toBeDefined();
    });
    it('should initialize with saveConnection set to true', () => {
      const { result } = renderHook(() => useCreateConnectionData(null));
      const { data, setData } = result.current;
      expect(data).toEqual({ saveConnection: true });
      expect(setData).toBeDefined();
    });
    it('should initialize with existing data', () => {
      const { result } = renderHook(() =>
        useCreateConnectionData(null, {
          saveConnection: true,
          nameDesc: mockK8sNameDescriptionFieldData(),
        }),
      );
      const { data, setData } = result.current;
      expect(data).toEqual({ saveConnection: true, nameDesc: mockK8sNameDescriptionFieldData() });
      expect(setData).toBeDefined();
    });
    it('should update the connection data', () => {
      const { result } = renderHook(() => useCreateConnectionData(null));
      const { data, setData } = result.current;
      expect(data).toEqual({ saveConnection: true });
      expect(setData).toBeDefined();
    });
    it('should update the connection data with existing data', () => {
      const { result } = renderHook(() =>
        useCreateConnectionData(null, {
          saveConnection: true,
          nameDesc: mockK8sNameDescriptionFieldData(),
        }),
      );
      const { data, setData } = result.current;
      expect(data).toEqual({ saveConnection: true, nameDesc: mockK8sNameDescriptionFieldData() });
      expect(setData).toBeDefined();
    });
  });
  describe('Component', () => {
    const mockSetCreateConnectionData = jest.fn();
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('should not render without model location data', () => {
      render(
        <CreateConnectionInputFields
          createConnectionData={{
            saveConnection: true,
            nameDesc: mockK8sNameDescriptionFieldData(),
          }}
          setCreateConnectionData={mockSetCreateConnectionData}
          project={null}
          modelLocationData={undefined}
        />,
      );
      expect(screen.queryByTestId('save-connection-checkbox')).not.toBeInTheDocument();
      expect(screen.queryByTestId('save-connection-name-desc-name')).not.toBeInTheDocument();
    });
    it('should not render with model location data of type existing', () => {
      render(
        <CreateConnectionInputFields
          createConnectionData={{
            saveConnection: true,
            nameDesc: mockK8sNameDescriptionFieldData(),
          }}
          setCreateConnectionData={mockSetCreateConnectionData}
          project={null}
          modelLocationData={{ ...mockModelLocationData, type: ModelLocationType.EXISTING }}
        />,
      );
      expect(screen.queryByTestId('save-connection-checkbox')).not.toBeInTheDocument();
      expect(screen.queryByTestId('save-connection-name-desc-name')).not.toBeInTheDocument();
    });
    it('should render with model location data', () => {
      render(
        <CreateConnectionInputFields
          createConnectionData={{
            saveConnection: true,
            nameDesc: mockK8sNameDescriptionFieldData(),
          }}
          setCreateConnectionData={mockSetCreateConnectionData}
          project={null}
          modelLocationData={mockModelLocationData}
        />,
      );
      expect(screen.getByTestId('save-connection-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('save-connection-checkbox')).toBeChecked();
      expect(screen.getByTestId('save-connection-name-desc-name')).toBeInTheDocument();
      expect(screen.getByTestId('save-connection-name-desc-name')).toHaveValue('');
    });
    it('should call setCreateConnectionData with the correct data when checkbox is clicked', async () => {
      render(
        <CreateConnectionInputFields
          createConnectionData={{
            saveConnection: true,
            nameDesc: mockK8sNameDescriptionFieldData(),
          }}
          setCreateConnectionData={mockSetCreateConnectionData}
          project={null}
          modelLocationData={mockModelLocationData}
        />,
      );
      const checkbox = screen.getByTestId('save-connection-checkbox');
      await act(async () => {
        fireEvent.click(checkbox);
      });
      expect(mockSetCreateConnectionData).toHaveBeenCalledWith({
        saveConnection: false,
        nameDesc: undefined,
      });
    });
    it('should call setCreateConnectionData with the correct data when name and description are changed', async () => {
      render(
        <CreateConnectionInputFields
          createConnectionData={{
            saveConnection: true,
            nameDesc: mockK8sNameDescriptionFieldData(),
          }}
          setCreateConnectionData={mockSetCreateConnectionData}
          project={null}
          modelLocationData={mockModelLocationData}
        />,
      );
      const nameInput = screen.getByTestId('save-connection-name-desc-name');
      const descriptionInput = screen.getByTestId('save-connection-name-desc-description');
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'test' } });
      });
      expect(mockSetCreateConnectionData).toHaveBeenCalledWith({
        nameDesc: {
          name: 'test',
          description: '',
          k8sName: {
            value: '',
            state: {
              immutable: false,
              invalidCharacters: false,
              invalidLength: false,
              maxLength: 253,
              touched: false,
              invalidCharsMessage: undefined,
              safePrefix: undefined,
              staticPrefix: undefined,
              regexp: undefined,
            },
          },
        },
        saveConnection: true,
      });
      await act(async () => {
        fireEvent.change(descriptionInput, { target: { value: 'test description' } });
      });
      expect(mockSetCreateConnectionData).toHaveBeenCalledWith({
        saveConnection: true,
        nameDesc: {
          name: 'test',
          description: 'test description',
          k8sName: {
            value: 'test',
            state: {
              immutable: false,
              invalidCharacters: false,
              invalidLength: false,
              maxLength: 253,
              touched: false,
              invalidCharsMessage: undefined,
              safePrefix: undefined,
              staticPrefix: undefined,
              regexp: undefined,
            },
          },
        },
      });
    });
  });
});
