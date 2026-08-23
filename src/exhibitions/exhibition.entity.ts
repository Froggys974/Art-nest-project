import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { Artwork } from 'src/artworks/artwork.entity';

@Entity()
export class Exhibition {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date' })
  endDate!: string;

  @Column()
  locationOrUrl!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'galleryId' })
  gallery!: User;

  @Column()
  galleryId!: number;

  @ManyToMany(() => Artwork)
  @JoinTable()
  artworks!: Artwork[];
}
