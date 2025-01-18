export type TResponseError = { error: string };

export type TResponseData<T> = { data: T } | TResponseError;
