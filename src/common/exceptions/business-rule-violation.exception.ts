export class BusinessRuleViolationException extends Error {
  constructor(
    message: string,
    readonly rule: string,
  ) {
    super(message);
    this.name = BusinessRuleViolationException.name;
  }
}
