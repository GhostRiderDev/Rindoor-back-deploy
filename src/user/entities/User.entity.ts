import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Role } from './Role.enum';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column({ type: 'varchar', length: 50, nullable: false })
  firstName: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  lastName: string;

  @Column({ type: 'varchar', length: 150, nullable: false, unique: true})
  email: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  address: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    precision: 2,
    scale: 2,
  })
  rating: number;

  @Column({
    type: 'enum',
    enum: Role,
    nullable: false,
  })
  role: Role;
}