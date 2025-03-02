import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { ticker: string } }
) {
  try {
    const ticker = params.ticker.toUpperCase();

    // Get price data
    const { data: priceData, error: priceError } = await supabase
      .from('stock_prices')
      .select('*')
      .eq('ticker', ticker)
      .order('date', { ascending: true });

    if (priceError) throw priceError;

    // Get summary data
    const { data: summaryData, error: summaryError } = await supabase
      .from('stock_summaries')
      .select('*')
      .eq('ticker', ticker)
      .single();

    if (summaryError) throw summaryError;

    // Calculate moving averages
    const prices = priceData.map(d => ({
      ...d,
      MA20: calculateMA(priceData, d.date, 20),
      MA50: calculateMA(priceData, d.date, 50),
      avg_20day_volume: calculateMA(priceData, d.date, 20, 'volume')
    }));

    return NextResponse.json({
      data: {
        price_data: prices,
        volume_data: prices
      },
      summary: summaryData
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}

function calculateMA(data: any[], currentDate: string, period: number, field: string = 'close') {
  const currentIndex = data.findIndex(d => d.date === currentDate);
  if (currentIndex < period - 1) return null;

  const slice = data.slice(currentIndex - period + 1, currentIndex + 1);
  const sum = slice.reduce((acc, curr) => acc + curr[field], 0);
  return sum / period;
}
