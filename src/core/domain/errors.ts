/** خطاهای دامنه — لایه‌ی HTTP این‌ها را به کد وضعیت مناسب ترجمه می‌کند. */

export type DomainErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'CONVERSATION_CLOSED'
  | 'TURN_LIMIT'
  | 'DUPLICATE_SIGNAL'
  | 'ENGINE_FAILURE';

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export function notFound(what: string): DomainError {
  return new DomainError('NOT_FOUND', `${what} یافت نشد.`);
}

export function forbidden(): DomainError {
  return new DomainError('FORBIDDEN', 'اجازه‌ی این کار را ندارید.');
}
