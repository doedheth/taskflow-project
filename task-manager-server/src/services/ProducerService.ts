/**
 * Producer Service
 */

import { BaseService, ValidationError } from './BaseService';
import { producerRepository, ProducerRepository } from '../models/ProducerRepository';
import { Producer, CreateProducerDTO, UpdateProducerDTO } from '../types/inspection';

export class ProducerService extends BaseService<Producer, CreateProducerDTO, UpdateProducerDTO> {
  private producerRepository: ProducerRepository;

  constructor() {
    super(producerRepository);
    this.producerRepository = producerRepository;
  }

  search(query: string): Producer[] {
    if (!query || query.length < 2) return [];
    return this.producerRepository.search(query);
  }

  create(data: CreateProducerDTO, userId?: number): Producer {
    if (!data.name) {
      throw new ValidationError('Producer name is required', [{ field: 'name', message: 'Name is required' }]);
    }

    if (!data.code || !data.code.trim()) {
      data.code = this.generateUniqueCode('PROD', 3);
    } else {
      data.code = data.code.toUpperCase().trim();
    }

    const existing = this.producerRepository.findOneBy('code', data.code);
    if (existing) {
      throw new ValidationError('Producer code already exists', [{ field: 'code', message: 'Producer code already exists' }]);
    }

    return super.create(data, userId);
  }

  private generateUniqueCode(prefix: string, width: number): string {
    const like = `${prefix}%`;
    let idx = this.producerRepository.count('code LIKE ?', [like]) + 1;
    for (let i = 0; i < 10000; i++) {
      const code = `${prefix}${String(idx).padStart(width, '0')}`;
      if (!this.producerRepository.findOneBy('code', code)) return code;
      idx++;
    }
    return `${prefix}${Date.now()}`;
  }

  protected validateCreate(data: CreateProducerDTO): void {
    // Validation moved into create(): require name, ensure unique when provided/generated
  }
}

export const producerService = new ProducerService();
export default producerService;
