// src/repositories/deposit-session.repo.ts
import AppDataSource from "../configs/ormconfig";
import { Repository } from "typeorm";
import { DepositSession } from "../models/deposit-session.entity";
import { OnchainProcessedEvent } from "../models/onchain-processed-event.entity";

export type DepositSessionStatus =
  | "AWAITING_TRANSFER"
  | "RECEIVED"
  | "CONFIRMED"
  | "EXPIRED"
  | "FAILED";

export class DepositSessionRepository {
  private sessionRepo: Repository<DepositSession>;
  private processedRepo: Repository<OnchainProcessedEvent>;

  constructor() {
    this.sessionRepo = AppDataSource.getRepository(DepositSession);
    this.processedRepo = AppDataSource.getRepository(OnchainProcessedEvent);
  }

  async create(data: Partial<DepositSession>) {
    const session = this.sessionRepo.create(data);
    return await this.sessionRepo.save(session);
  }

  async getById(id: string) {
    return await this.sessionRepo.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: DepositSessionStatus) {
    await this.sessionRepo.update({ id }, { status });
    return await this.getById(id);
  }

  async bindOnchainEvent(
    sessionId: string,
    data: {
      txHash: string;
      logIndex: number;
      fromAddress?: string;
      amount: number;
      blockNumber: number;
    }
  ) {
    await this.sessionRepo.update(
      { id: sessionId },
      {
        matchedTxHash: data.txHash,
        matchedLogIndex: data.logIndex,
        matchedFromAddress: data.fromAddress ?? undefined,
        matchedAmount: data.amount,
        matchedBlockNumber: data.blockNumber,
      }
    );

    return await this.getById(sessionId);
  }

  async isEventProcessed(params: { chain: string; txHash: string; logIndex: number }) {
    const found = await this.processedRepo.findOne({
      where: {
        chain: params.chain,
        txHash: params.txHash.toLowerCase(),
        logIndex: params.logIndex,
      },
    });
    return !!found;
  }

  /**
   * Strong idempotency: insert (chain, txHash, logIndex) once.
   * If it already exists, ignore (no error).
   */
  async markEventProcessed(params: { chain: string; txHash: string; logIndex: number }) {
    // TypeORM upsert requires unique constraint on (chain, txHash, logIndex)
    await this.processedRepo.upsert(
      {
        chain: params.chain,
        txHash: params.txHash.toLowerCase(),
        logIndex: params.logIndex,
        processedAt: new Date(),
      } as any,
      ["chain", "txHash", "logIndex"]
    );

    return true;
  }
}
