import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('short-links')
export class ShortLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  originalUrl: string;

  /* 
    Short Code should contains about 8 characters only, so we have about 62^8 possible short codes: 3.521.614.606.208 -> 218T
    Why we use base 62? because we can represent 0-9 and a-z in base 62, exclude + and /
  */
  @Column({ type: 'varchar', unique: true, length: 255 })
  shortCode: string;

  @Column({ type: 'text' })
  canonicalUrl: string;

  @Column({ type: 'varchar', unique: true, length: 255 })
  canonicalHash: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiredAt?: Date;

  @Column({ type: 'varchar', length: 255 })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
