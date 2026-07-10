import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { Artwork } from './artwork.entity';
import { ArtworkStatus } from './artwork-status.enum';

// One row / status transition, traceability rule
@Entity()
export class ArtworkStatusHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Artwork, { nullable: false })
  @JoinColumn({ name: 'artworkId' })
  artwork!: Artwork;

  @Column()
  artworkId!: number;

  // Null on first entry
  @Column({ type: 'enum', enum: ArtworkStatus, nullable: true })
  previousStatus!: ArtworkStatus | null;

  @Column({ type: 'enum', enum: ArtworkStatus })
  newStatus!: ArtworkStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changedById' })
  changedBy!: User | null;

  @Column({ type: 'int', nullable: true })
  changedById!: number | null;

  @CreateDateColumn()
  changedAt!: Date;
}
