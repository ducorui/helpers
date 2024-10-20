import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import http from "@ducor/http-client";
import isEqual from "lodash.isequal";

export type AnyMethod = (...args: any[]) => any;

type FormFieldData = Record<string, string | string[]>;

type FormFieldsError =  Record<string, string[]>;

interface OnFinish {
  response: any;
  filedData: FormFieldData;
  errors: FormFieldsError;
  wasSuccessful: boolean;
  hasErrors: boolean;
}

interface OptionsOrConfig {
  onStart?: () => void;
  onSuccess?: (response: any) => void;
  onError?: (error: FormFieldsError) => void;
  onFinish?: (data: OnFinish) => void;
}

interface HttpInterface {
  get: (url: string, params?: any, options?: OptionsOrConfig) => Promise<void>;
  post: (url: string, data?: any, options?: OptionsOrConfig) => Promise<void>;
  put: (url: string, data?: any, options?: OptionsOrConfig) => Promise<void>;
  patch: (url: string, data?: any, options?: OptionsOrConfig) => Promise<void>;
  delete: (url: string, data?: any, options?: OptionsOrConfig) => Promise<void>;
  [key: string]: (
    url: string,
    data?: any,
    options?: OptionsOrConfig
  ) => Promise<void>;
}

interface UseFormReturn {
  isDirty: boolean;
  processing: boolean;
  hasErrors: boolean;
  wasSuccessful: boolean;
  
  filedData: FormFieldData;
  setDefaults: (
    fieldOrFields?: string | FormFieldData,
    maybeValue?: FormFieldData[keyof FormFieldData]
  ) => void;
  setFiledData: (keyOrData: keyof FormFieldData | FormFieldData,
    maybeValue?: FormFieldData[keyof FormFieldData]) => void;
  transform: (callback: any) => any;
  reset: (...fields: Array<keyof FormFieldData>) => void;
  errors: FormFieldsError;

  clearErrors: () => void;
  setError: (
    fieldErrorOrErrros: string | FormFieldsError,
    maybeValue?: string[]
  ) => void;
  req: Record<string, AnyMethod>; // Proxy-like object for dynamic method handling
}

export const useForm = (
  rememberKeyOrInitialValues?: FormFieldData | string, maybeInitialValues?: FormFieldData,
): UseFormReturn => {

  const isMounted = useRef<boolean|null>(null);
  const rememberKey = typeof rememberKeyOrInitialValues === 'string' ? rememberKeyOrInitialValues : null

  const [defaults, setDefaults] = useState<FormFieldData>(
    (typeof rememberKeyOrInitialValues === 'string' ? maybeInitialValues : rememberKeyOrInitialValues) || ({} as FormFieldData)
  );

  let initialValues = {};
  if (rememberKeyOrInitialValues && typeof rememberKeyOrInitialValues === "object") {
    initialValues = rememberKeyOrInitialValues;
  }

  const [isMount, setIsMount] = useState(false);

  const [filedData, setFiledData] = useState<FormFieldData>({});
  const [errors, setErrors] = useState<FormFieldsError>({});
  const [processing, setProcessing] = useState<boolean>(false);
  const [hasErrors, setHasErrors] = useState<boolean>(false);
  const [wasSuccessful, setWasSuccessful] = useState(false);
  let transform = (data: FormFieldData) => data

  
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useMemo(() => {
    if (isMount) {
      return;
    }
    setDefaults(initialValues);
    setFiledData(initialValues);
    setErrors({});
    setIsMount(true);
  }, [initialValues]);

  // Common request handler function
  const request =   useCallback( (
    method: string,
    url: string,
    options: OptionsOrConfig = {}

  ) => {

    setWasSuccessful(false);
    setErrors({});
    setHasErrors(false);
    setProcessing(true);

    if (typeof options?.onStart === "function") {
      options?.onStart?.(); // Call the onStart hook
    }
    // Call the method dynamically on feach and chain promises

    const data = transform(filedData);

    return http[method](url, data) // Adjusted for typical feach usage
      .then((response: any) => {
        setWasSuccessful(true);

        // resolve setIsChanged
        setDefaults(filedData);

        if (typeof options?.onSuccess === "function") {
          options?.onSuccess?.(response); // Call the onSuccess hook
        }

        if (typeof options?.onFinish === "function") {
          options?.onFinish({
            response: response,
            filedData,
            errors,
            wasSuccessful,
            hasErrors,
          }); // Call the onFinish hook
        }
      })
      .catch((error: any) => {
        setHasErrors(true);
        if (error?.response?.status === 422) {
          const { errors } = error;
          let hasErrors = false;
          const filteredErrors: Record<string, string[]> = {};

          if (typeof errors === "object" && errors !== null) {
            Object.entries(errors).forEach(([fieldName, maybeValue]) => {
              if (typeof fieldName !== "string") return;

              if (Array.isArray(maybeValue) && maybeValue.length > 0) {
                const errorValue = maybeValue.filter(
                  (value) => typeof value === "string"
                ) as string[];

                if (errorValue.length > 0) {
                  filteredErrors[fieldName] = errorValue;
                  hasErrors = true;
                }
              }
            });
          }

          if (hasErrors) {
            setErrors(filteredErrors);
          }

          if (typeof options?.onFinish === "function") {
            options?.onFinish({
              response: undefined,
              filedData,
              errors: filteredErrors,
              wasSuccessful,
              hasErrors,
            }); // Call the onFinish hook
          }
        }

        options?.onError?.(error); // Call the onError hook
      })
      .finally(() => {
        setProcessing(false);
      });

  }, [filedData, setErrors, transform]);

  return {
    isDirty: !isEqual(filedData, defaults),
    processing,
    wasSuccessful,
    hasErrors,
    filedData,
    setDefaults: (
      fieldOrFields?: keyof FormFieldData | FormFieldData,
      maybeValue?: FormFieldData[keyof FormFieldData]
    ): void => {
      if (typeof fieldOrFields === "undefined") {
        setDefaults(() => filedData);
      } else if (
        typeof fieldOrFields === "string" &&
        typeof maybeValue !== "undefined"
      ) {
        setFiledData({ ...defaults, [fieldOrFields]: maybeValue });
      } else if (typeof fieldOrFields === "object") {
        const newData: FormFieldData = {};
        for (const key in fieldOrFields) {
          if (fieldOrFields.hasOwnProperty(key)) {
            newData[key] = fieldOrFields[key];
          }
        }
        setDefaults({
          ...defaults,
          ...newData,
        });
      }
    },
    setFiledData: (
      keyOrData: keyof FormFieldData | FormFieldData,
      maybeValue?: FormFieldData[keyof FormFieldData]
    ): void => {
      if (typeof keyOrData === "string" && maybeValue !== undefined) {
        setFiledData({
          ...filedData,
          [keyOrData]: maybeValue,
        });
      } else if (typeof keyOrData === "object") {
        const newData: FormFieldData = {};
        Object.entries(keyOrData).forEach(([key, value]) => {
          if (typeof key === "string") {
            newData[key] = value;
          }
        });
        setFiledData({
          ...filedData,
          ...newData,
        });
      }
    },

    transform(callback) {
      transform = callback
    },
    reset(...fields: Array<keyof FormFieldData>) {
      if (fields.length === 0) {
        setFiledData(defaults);
      } else {
        setFiledData(
          (Object.keys(defaults) as Array<keyof FormFieldData>)
            .filter((key) => fields.includes(key))
            .reduce(
              (carry, key) => {
                carry[key] = defaults[key];
                return carry;
              },
              { ...filedData }
            )
        );
      }
    },
    errors,
    setError : (
      fieldErrorOrErrors: string | FormFieldsError,
      maybeValue?: string[]
    ): void => {
      setErrors((errors: FormFieldsError) => {
        
        const newErrors: FormFieldsError = {
          ...errors,
          ...(typeof fieldErrorOrErrors === "string"
            ? { [fieldErrorOrErrors]: maybeValue || [] } // Default to empty array if undefined
            : (fieldErrorOrErrors as Record<string, string[]>)),
        };
    
        setHasErrors(Object.keys(newErrors).length > 0);
        return newErrors;
        
      });
    },
    clearErrors(...fields: Array<keyof FormFieldsError>): void {
      setErrors((errors) => {
        const newErrors = (
          Object.keys(errors) as Array<keyof FormFieldsError>
        ).reduce(
          (carry, field) => ({
            ...carry,
            ...(fields.length > 0 && !fields.includes(field)
              ? { [field]: errors[field] }
              : {}),
          }),
          {}
        );
        setHasErrors(Object.keys(newErrors).length > 0);
        return newErrors;
      });
    },
    // Proxy to intercept and dynamically handle HTTP methods
    req: new Proxy<Record<string, AnyMethod>>(
      {},
      {
        get(target, method: string) {
          return <T = any>(...args: any[]): T => {
            const [url, options] = args;

            return request(method, url, options) && target;
          };
        },
      }
    ),
  };
};

export default useForm;
