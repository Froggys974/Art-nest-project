import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserRole } from './user-role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.COLLECTOR })
  role!: UserRole;

  @Column({ default: false })
  isValidated!: boolean;

  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash!: string | null;
}
