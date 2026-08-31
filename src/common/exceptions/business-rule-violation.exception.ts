/**
 * Exception thrown when a business rule is violated.
 * Results in HTTP 422 Unprocessable Entity responses.
 */
export class BusinessRuleViolationException extends Error {
  /**
   * Creates a business rule violation exception.
   * @param message - Human-readable error message
   * @param rule - Machine-readable rule code (e.g., 'ARTWORK_ALREADY_SOLD')
   */
  constructor(
    message: string,
    readonly rule: string,
  ) {
    super(message);
    this.name = BusinessRuleViolationException.name;
  }
}
