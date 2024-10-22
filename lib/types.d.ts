export type State<Data = any, Error = any> = {
    data?: Data
    error?: Error
    isValidating?: boolean
    isLoading?: boolean
}

export interface Store<Data = any> {
    keys(): IterableIterator<string>
    get(key: string): State<Data> | undefined
    set(key: string, value: State<Data>): void
    delete(key: string): void
}

export interface StateDependencies {
    data?: boolean
    error?: boolean
    isValidating?: boolean
    isLoading?: boolean
}


export interface StoreHook{
    data: any, 
    isLoading: boolean; 
    wasSuccess: boolean;
    hasError: boolean;
    error?: string;
}