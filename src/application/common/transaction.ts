import { PrismaClient } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma';

export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

export class TransactionManager {
  /**
   * Execute multiple operations in a transaction
   * @param operations - Array of functions that receive a transaction client
   * @returns Promise with the result of the last operation
   */
  static async execute<T>(
    operations: ((tx: TransactionClient) => Promise<T>)[]
  ): Promise<T[]> {
    return await prisma.$transaction(async (tx) => {
      const results: T[] = [];
      for (const operation of operations) {
        const result = await operation(tx);
        results.push(result);
      }
      return results;
    });
  }

  /**
   * Execute a single operation in a transaction
   * @param operation - Function that receives a transaction client
   * @returns Promise with the result
   */
  static async executeSingle<T>(
    operation: (tx: TransactionClient) => Promise<T>
  ): Promise<T> {
    return await prisma.$transaction(operation);
  }
}
