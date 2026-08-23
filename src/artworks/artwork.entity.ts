import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { Artist } from 'src/artists/artist.entity';
import { NumericTransformer } from 'src/common/typeorm/numeric.transformer';
import { ArtworkStatus } from './artwork-status.enum';

@Entity()
@Index(['artistId', 'status'])
export class Artwork {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'int' })
  creationYear!: number;

  @Column()
  technique!: string;

  @Column()
  dimensions!: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  price!: number;

  // Floor price
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  reservePrice!: number;

  @Index()
  @Column({
    type: 'enum',
    enum: ArtworkStatus,
    default: ArtworkStatus.AVAILABLE,
  })
  status!: ArtworkStatus;

  @Column({ type: 'varchar', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'date' })
  depositDate!: string;

  @ManyToOne(() => Artist, { nullable: false })
  @JoinColumn({ name: 'artistId' })
  artist!: Artist;

  @Column()
  artistId!: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'galleryId' })
  gallery!: User;

  @Column()
  galleryId!: number;
}
