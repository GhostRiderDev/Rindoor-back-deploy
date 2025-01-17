import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/User.entity';
import { Category } from 'src/category/entities/category.entity';
import { PaginationQuery } from 'src/dto/pagintation.dto';
import { FileUpload } from 'src/cloudinary/FileUpload';
import { filterJobCategory } from 'src/dto/filterJob.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private jobRepository: Repository<Job>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private fileUploadService: FileUpload,
  ) {}

  async create(createJobDto: CreateJobDto, file) {
    const foundUser = await this.userRepository.findOne({
      where: { id: createJobDto.userId },
    });
    if (!foundUser) throw new NotFoundException('Usuario not found');
    if (foundUser.role !== 'CLIENT')
      throw new UnauthorizedException('Accesso solo para los Clientes');

    const foundCategory = await this.categoryRepository.findOne({
      where: { id: createJobDto.categoryId },
    });
    if (!foundCategory) throw new NotFoundException('Categoria no encontrada');

    let imgUrl: string;
    if (file) {
      const imgUpload = await this.fileUploadService.uploadImg(file);
      if (!imgUpload) {
        throw new HttpException(
          'Error al subir la imagen',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      imgUrl = imgUpload.url;
    }

    const newJob = {
      ...createJobDto,
      category: foundCategory,
      user: foundUser,
      img: imgUrl,
    };
    return await this.jobRepository.save(newJob);
  }

  async findAll(filter?: filterJobCategory) {
    const { page, limit, categories, minPrice, maxPrice } = filter;
    const defaultPage = page || 1;
    const defaultLimit = limit || 10;
    let defaultCategories = [];

    if (Array.isArray(categories)) {
      defaultCategories = categories;
    } else if (categories) {
      if (typeof categories === 'string') {
        defaultCategories = [categories];
      } else if (categories) {
        defaultCategories = [categories];
      }
    }

    defaultCategories = defaultCategories.map((category) =>
      category.trim().toLowerCase().normalize(),
    );

    const defaultMinPrice = minPrice || 0;
    const defaultMaxPrice = maxPrice || 999999999.99;

    const startIndex = (defaultPage - 1) * defaultLimit;
    const endIndex = startIndex + defaultLimit;

    const jobs = await this.jobRepository.find({
      relations: { category: true },
    });

    const filterJobs = jobs.filter(
      (job) =>
        job.base_price >= defaultMinPrice && job.base_price <= defaultMaxPrice,
    );

    const filterCategories = filterJobs.filter((job) =>
      defaultCategories.includes(
        job.category.name.toLowerCase().trim().normalize(),
      ),
    );
    const sliceJobs = filterCategories.slice(startIndex, endIndex);

    return sliceJobs;
  }

  async findOne(id: string) {
    const findJob = await this.jobRepository.findOne({
      where: { id: id },
      relations: { user: true },
    });
    if (!findJob) throw new NotFoundException('Trabajo no encontrado');

    return findJob;
  }

  async remove(id: string) {
    const findJob = await this.jobRepository.findOne({
      where: { id: id },
      relations: { user: true },
    });
    if (!findJob) throw new NotFoundException('Trabajo no encontrado');

    if (findJob.user.role !== 'CLIENT')
      throw new BadRequestException('Action just for Clients');

    await this.jobRepository.remove(findJob);
    return `Trabajo con id: ${id} eliminado`;
  }
}
