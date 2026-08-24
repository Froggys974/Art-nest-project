import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessRuleViolationException } from '../common/exceptions/business-rule-violation.exception';
import { Artwork } from './artwork.entity';
import {
  ArtworkLimitPipe,
  MAX_ACTIVE_ARTWORKS_PER_ARTIST,
} from './artwork-limit.pipe';
import { CreateArtworkDto } from './dto/create-artwork.dto';

describe('ArtworkLimitPipe', () => {
  let pipe: ArtworkLimitPipe;
  let artworkRepository: { countBy: jest.Mock };

  const dto = { artistId: 1 } as CreateArtworkDto;

  beforeEach(async () => {
    artworkRepository = { countBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtworkLimitPipe,
        { provide: getRepositoryToken(Artwork), useValue: artworkRepository },
      ],
    }).compile();

    pipe = module.get<ArtworkLimitPipe>(ArtworkLimitPipe);
  });

  it('passes the dto through when the artist is under the limit', async () => {
    artworkRepository.countBy.mockResolvedValue(
      MAX_ACTIVE_ARTWORKS_PER_ARTIST - 1,
    );

    await expect(pipe.transform(dto)).resolves.toBe(dto);
  });

  it('rejects the 51st active artwork', async () => {
    artworkRepository.countBy.mockResolvedValue(MAX_ACTIVE_ARTWORKS_PER_ARTIST);

    await expect(pipe.transform(dto)).rejects.toThrow(
      BusinessRuleViolationException,
    );
  });
});
