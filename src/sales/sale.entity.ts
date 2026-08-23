import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { Artwork } from 'src/artworks/artwork.entity';
import { NumericTransformer } from 'src/common/typeorm/numeric.transformer';

@Entity()
export class Sale {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @CreateDateColumn()
  date!: Date;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  salePrice!: number;

  // commission 40/35/30% computed at sale time and stored for tracability.
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  galleryCommission!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  artistBalance!: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'collectorId' })
  collector!: User;

  @Column()
  collectorId!: number;

  @OneToOne(() => Artwork, { nullable: false })
  @JoinColumn({ name: 'artworkId' })
  artwork!: Artwork;

  @Column()
  artworkId!: number;
}
