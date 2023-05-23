import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAllUserNotifications(userId: number) {
    return await this.notificationRepository.find({
      where: { userToNotify: { id: userId } },
      relations: ['user', 'post'],
      order: { date: -1 },
    });
  }

  async createNotification(notificationDto: Partial<Omit<Notification, 'id'>>) {
    await this.notificationRepository.save({ ...notificationDto });
  }

  async deleteNotification(options: FindOptionsWhere<Notification>) {
    await this.notificationRepository.delete(options);
  }
}
