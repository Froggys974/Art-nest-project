import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { ArtistStatus } from './artist-status.enum';

@Entity()
export class Artist {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ type: 'text', nullable: true })
  biography!: string | null;

  @Column({ type: 'varchar', nullable: true })
  portfolioUrl!: string | null;

  @Column()
  nationality!: string;

  @Column({ type: 'enum', enum: ArtistStatus, default: ArtistStatus.ACTIVE })
  status!: ArtistStatus;

  @Column({ type: 'date' })
  entryDate!: string;

  // Gallery is a User with the `gallery` role.
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'galleryId' })
  gallery!: User;

  @Column()
  galleryId!: number;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Column({ type: 'int', nullable: true })
  userId!: number | null;
}
