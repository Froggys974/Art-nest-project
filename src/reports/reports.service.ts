import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Artist } from 'src/artists/artist.entity';
import { Artwork } from 'src/artworks/artwork.entity';
import { Sale } from 'src/sales/sale.entity';
import { SafeUser } from 'src/user/types/safe-user.type';
import { UserRole } from 'src/user/user-role.enum';
import { sum } from 'src/common/money';

/**
 * Platform-wide sales summary for administrators.
 */
export type AdminSummary = {
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
  totalArtistBalance: number;
};

/**
 * Sales summary for a specific gallery.
 */
export type GallerySummary = {
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
};

/**
 * Revenue summary for a specific artist.
 */
export type ArtistRevenue = {
  totalSales: number;
  totalRevenue: number;
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
  ) {}

  /**
   * Generates a platform-wide sales summary for admin users.
   * @returns Summary containing total sales, revenue, commission, and artist balance
   */
  async adminSummary(): Promise<AdminSummary> {
    const sales = await this.saleRepository.find();
    return {
      totalSales: sales.length,
      totalRevenue: sum(sales.map((sale) => sale.salePrice)),
      totalCommission: sum(sales.map((sale) => sale.galleryCommission)),
      totalArtistBalance: sum(sales.map((sale) => sale.artistBalance)),
    };
  }

  /**
   * Generates a sales summary for a specific gallery.
   * @param galleryId - The gallery ID
   * @returns Summary containing total sales, revenue, and commission for the gallery
   */
  async gallerySales(galleryId: number): Promise<GallerySummary> {
    const artworks = await this.artworkRepository.findBy({ galleryId });
    if (artworks.length === 0) {
      return { totalSales: 0, totalRevenue: 0, totalCommission: 0 };
    }
    const sales = await this.saleRepository.findBy({
      artworkId: In(artworks.map((artwork) => artwork.id)),
    });
    return {
      totalSales: sales.length,
      totalRevenue: sum(sales.map((sale) => sale.salePrice)),
      totalCommission: sum(sales.map((sale) => sale.galleryCommission)),
    };
  }

  /**
   * Generates a revenue report for a specific artist, checking user permissions.
   * @param artistId - The artist ID
   * @param user - The user requesting the report (must be admin or owning gallery)
   * @returns Revenue summary for the artist
   * @throws {NotFoundException} If artist not found
   * @throws {ForbiddenException} If gallery user doesn't own the artist
   */
  async artistRevenue(
    artistId: number,
    user: Pick<SafeUser, 'userId' | 'role'>,
  ): Promise<ArtistRevenue> {
    const artist = await this.artistRepository.findOneBy({ id: artistId });
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }
    if (user.role === UserRole.GALLERY && artist.galleryId !== user.userId) {
      throw new ForbiddenException('Artist belongs to another gallery');
    }

    return this.computeArtistRevenue(artistId);
  }

  /**
   * Generates a revenue report for the current artist user.
   * @param userId - The user ID of the artist
   * @returns Revenue summary for the artist
   * @throws {NotFoundException} If no artist profile is linked to this account
   */
  async myRevenue(userId: number): Promise<ArtistRevenue> {
    const artist = await this.artistRepository.findOneBy({ userId });
    if (!artist) {
      throw new NotFoundException('No artist profile linked to this account');
    }
    return this.computeArtistRevenue(artist.id);
  }

  /**
   * Computes the total revenue for an artist from their sold artworks.
   * @param artistId - The artist ID
   * @returns Revenue summary containing total sales and artist balance
   */
  private async computeArtistRevenue(artistId: number): Promise<ArtistRevenue> {
    const artworks = await this.artworkRepository.findBy({ artistId });
    if (artworks.length === 0) {
      return { totalSales: 0, totalRevenue: 0 };
    }
    const sales = await this.saleRepository.findBy({
      artworkId: In(artworks.map((artwork) => artwork.id)),
    });
    return {
      totalSales: sales.length,
      totalRevenue: sum(sales.map((sale) => sale.artistBalance)),
    };
  }
}
