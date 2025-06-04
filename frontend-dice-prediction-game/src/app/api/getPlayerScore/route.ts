import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { diceGameAbi } from '../../../constants';

export async function POST(request: NextRequest) {
  try {
    const { playerAddress, contractAddress } = await request.json();

    if (!playerAddress || !contractAddress) {
      return NextResponse.json(
        { error: 'Player address and contract address are required' },
        { status: 400 }
      );
    }

    // Create a public client to read from the blockchain
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http()
    });

    // Call the getPlayerScore function
    const score = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceGameAbi,
      functionName: 'getPlayerScore',
      args: [playerAddress as `0x${string}`],
    });

    return NextResponse.json({ score: score.toString() });
  } catch (error) {
    console.error('Error fetching player score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player score' },
      { status: 500 }
    );
  }
}
