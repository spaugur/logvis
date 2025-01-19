export type TResponseError = { error: string };

export type TResponseData<T> = { data: T } | TResponseError;

export type Result<T, E> = [E] | [null, T];
