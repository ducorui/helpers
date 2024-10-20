import { useEffect, useMemo, useState } from "react";
import http from "@ducor/http-client";
import isEqual from "lodash.isequal";

export type AnyMethod = (...args: any[]) => any;

type FormFiledData = {
  [key: string]: string | string[];
};

type FormFieldsError = {
  [key: string]: string | string[];
};

interface OnFinish {
  response: any;
  filedData: FormFiledData;
  errors: FormFieldsError;
  isSuccess: boolean;
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
  isChanged: boolean;
  processing: boolean;
  filedData: FormFiledData;
  setDefaults: (
    fieldOrFields?: string | FormFiledData,
    maybeValue?: FormFiledData[keyof FormFiledData]
  ) => void;
  setFiledData: (filedData: FormFiledData) => void;
  transform: (filedData: FormFiledData) => void;
  reset: (...fields: Array<keyof FormFiledData>) => void;
  errors: FormFieldsError;
  hasErrors: boolean;
  isSuccess: boolean;
  clearErrors: () => void;
  setError: (
    fieldErrorOrErrros: keyof FormFieldsError | FormFieldsError,
    maybeValue?: string | string[]
  ) => void;
  req: Record<string, AnyMethod>; // Proxy-like object for dynamic method handling
}

export const useForm = (
  initialData: FormFiledData | string | undefined = {}
): UseFormReturn => {
  let rememeberKey: string | null = null;
  let initialValues = {};
  if (initialData && typeof initialData === "object") {
    initialValues = initialData;
  }

  if (typeof initialData === "string") {
    rememeberKey = initialData;
  }

  const [isMount, setIsMount] = useState(false);
  const [defaults, setDefaults] = useState<FormFiledData>({});
  const [filedData, setFiledData] = useState<FormFiledData>({});
  const [isDirty, setIsDirty] = useState<boolean>(false); // form value change
  const [errors, setErrors] = useState<FormFieldsError>({});
  const [processing, setProcessing] = useState<boolean>(false);
  const [hasErrors, setHasErrors] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isChanged, setIsChanged] = useState(false);

  useMemo(() => {
    if (isMount) {
      return;
    }
    setDefaults(initialValues);
    setFiledData(initialValues);
    setErrors({});
    setIsMount(true);
  }, [initialValues]);

  // check is changes
  useEffect(() => {
    setIsChanged(!isEqual(defaults, filedData));
  }, [defaults, filedData]);

  // Common request handler function
  const request = (
    method: string,
    url: string,
    options: OptionsOrConfig = {}
  ) => {
    setIsSuccess(false);
    setErrors({});
    setHasErrors(false);
    setProcessing(true);

    if (typeof options?.onStart === "function") {
      options?.onStart?.(); // Call the onStart hook
    }
    // Call the method dynamically on feach and chain promises

    return http[method](url, filedData) // Adjusted for typical feach usage
      .then((response: any) => {
        setIsSuccess(true);

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
            isSuccess,
            hasErrors,
          }); // Call the onFinish hook
        }
      })
      .catch((error: any) => {
        setHasErrors(true);
        if (error?.response?.status === 422) {
          const { errors } = error;
          let hasErrors = false;
          const filteredErrors: Record<string, string | string[]> = {};

          if (typeof errors === "object" && errors !== null) {
            Object.entries(errors).forEach(([fieldName, maybeValue]) => {
              if (typeof fieldName !== "string") return;

              if (typeof maybeValue === "string") {
                filteredErrors[fieldName] = maybeValue;
                hasErrors = true;
                return;
              }

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
              isSuccess,
              hasErrors,
            }); // Call the onFinish hook
          }
        }

        options?.onError?.(error); // Call the onError hook
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  return {
    isDirty,
    isChanged,
    processing,
    isSuccess,
    hasErrors,
    filedData,
    setDefaults: (
      fieldOrFields?: keyof FormFiledData | FormFiledData,
      maybeValue?: FormFiledData[keyof FormFiledData]
    ): void => {
      if (typeof fieldOrFields === "undefined") {
        setDefaults(() => filedData);
      } else if (
        typeof fieldOrFields === "string" &&
        typeof maybeValue !== "undefined"
      ) {
        setFiledData({ ...defaults, [fieldOrFields]: maybeValue });
      } else if (typeof fieldOrFields === "object") {
        const newData: FormFiledData = {};
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
      keyOrData: keyof FormFiledData | FormFiledData,
      maybeValue?: FormFiledData[keyof FormFiledData]
    ): void => {
      if (typeof keyOrData === "string" && maybeValue !== undefined) {
        setFiledData({
          ...filedData,
          [keyOrData]: maybeValue,
        });
      } else if (typeof keyOrData === "object") {
        const newData: FormFiledData = {};
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

    transform(fields: FormFiledData) {
      setFiledData(fields);
    },
    reset(...fields: Array<keyof FormFiledData>) {
      if (fields.length === 0) {
        setFiledData(defaults);
      } else {
        setFiledData(
          (Object.keys(defaults) as Array<keyof FormFiledData>)
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
    setError: (
      fieldErrorOrErrros: keyof FormFieldsError | FormFieldsError,
      maybeValue?: string | string[]
    ): void => {
      setErrors((errors: FormFieldsError) => {
        const newErrors: FormFieldsError = {
          ...errors,
          ...((typeof fieldErrorOrErrros === "string" &&
            typeof maybeValue === "string") ||
          (typeof fieldErrorOrErrros === "string" &&
            typeof maybeValue === "object" &&
            Array.isArray(maybeValue))
            ? { [fieldErrorOrErrros]: maybeValue }
            : (fieldErrorOrErrros as Record<
                keyof FormFieldsError,
                string | string[]
              >)),
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
