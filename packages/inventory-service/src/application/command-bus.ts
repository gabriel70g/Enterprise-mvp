export interface CommandHandler<T> {
  handle(command: T): Promise<void>;
}

export class CommandBus {
  private handlers = new Map<string, CommandHandler<any>>();

  register<T>(commandType: string, handler: CommandHandler<T>): void {
    this.handlers.set(commandType, handler);
  }

  async execute<T>(commandType: string, command: T): Promise<void> {
    const handler = this.handlers.get(commandType);
    
    if (!handler) {
      throw new Error(`No handler registered for command: ${commandType}`);
    }

    await handler.handle(command);
  }
}
