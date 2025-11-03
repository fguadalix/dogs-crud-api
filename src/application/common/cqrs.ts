export interface ICommand<TResult = void> {
  execute(): Promise<TResult>;
}

export interface IQuery<TResult> {
  execute(): Promise<TResult>;
}

export abstract class Command<TResult = void> implements ICommand<TResult> {
  abstract execute(): Promise<TResult>;
}

export abstract class Query<TResult> implements IQuery<TResult> {
  abstract execute(): Promise<TResult>;
}
