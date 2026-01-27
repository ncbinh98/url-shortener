import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Like, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { QueryUserDto } from './dto/query-user.dto';
import { UtilsService } from 'src/shared/utils/utiles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private utilsService: UtilsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (await this.findByEmail(createUserDto.email))
      throw new BadRequestException('Email already exists');
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  async findAll(dto: QueryUserDto) {
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;
    const query = {};
    if (dto.email) {
      query['email'] = Like(`%${dto.email}%`);
    }
    if (dto.isActive) {
      query['isActive'] = dto.isActive;
    }
    const [users, total] = await this.usersRepository.findAndCount({
      where: query,
      take: limit,
      skip: (page - 1) * limit,
      order: {
        createdAt: 'DESC',
      },
    });
    return this.utilsService.formatPagination({
      items: users,
      page,
      limit,
      total,
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async findOneRefreshToken(id: string, refreshToken: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, refreshToken },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
