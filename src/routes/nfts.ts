import { FastifyInstance } from 'fastify';
import { requestMint, confirmMint, revokeNft, getNftByActorId, getNftByTokenId, listNfts } from '../domain/nft.js';
import { AppError } from '../lib/errors.js';

export default async function nftRoutes(app: FastifyInstance) {
  // POST /agents/:id/mint — request NFT mint
  app.post('/agents/:id/mint', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { owner_address: string; metadata_uri?: string };

    if (!body.owner_address) {
      reply.status(400);
      return { ok: false, error: 'owner_address is required' };
    }

    try {
      const nft = await requestMint({
        actor_id: id,
        owner_address: body.owner_address,
        metadata_uri: body.metadata_uri,
      });
      reply.status(201);
      return { ok: true, data: nft };
    } catch (err) {
      if (err instanceof AppError) {
        reply.status(err.statusCode);
        return { ok: false, error: err.message };
      }
      throw err;
    }
  });

  // POST /agents/:id/mint/confirm — confirm on-chain mint
  app.post('/agents/:id/mint/confirm', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { token_id: number; tx_hash: string };

    if (body.token_id === undefined || !body.tx_hash) {
      reply.status(400);
      return { ok: false, error: 'token_id and tx_hash are required' };
    }

    try {
      const nft = await confirmMint(id, body.token_id, body.tx_hash);
      return { ok: true, data: nft };
    } catch (err) {
      if (err instanceof AppError) {
        reply.status(err.statusCode);
        return { ok: false, error: err.message };
      }
      throw err;
    }
  });

  // POST /agents/:id/nft/revoke — revoke NFT
  app.post('/agents/:id/nft/revoke', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const nft = await revokeNft(id);
      return { ok: true, data: nft };
    } catch (err) {
      if (err instanceof AppError) {
        reply.status(err.statusCode);
        return { ok: false, error: err.message };
      }
      throw err;
    }
  });

  // GET /agents/:id/nft — get NFT details
  app.get('/agents/:id/nft', async (request, reply) => {
    const { id } = request.params as { id: string };
    const nft = await getNftByActorId(id);
    if (!nft) {
      reply.status(404);
      return { ok: false, error: 'No NFT found for this agent' };
    }
    return { ok: true, data: nft };
  });

  // GET /nfts/:tokenId — get NFT by token ID
  app.get('/nfts/:tokenId', async (request, reply) => {
    const { tokenId } = request.params as { tokenId: string };
    const nft = await getNftByTokenId(Number(tokenId));
    if (!nft) {
      reply.status(404);
      return { ok: false, error: 'NFT not found' };
    }
    return { ok: true, data: nft };
  });

  // GET /nfts — list all NFTs
  app.get('/nfts', async (request) => {
    const q = request.query as Record<string, string>;
    const result = await listNfts({
      status: q.status,
      limit: q.limit ? Number(q.limit) : undefined,
      offset: q.offset ? Number(q.offset) : undefined,
    });
    return { ok: true, data: result };
  });
}
