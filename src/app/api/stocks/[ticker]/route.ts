import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface StockPrice {
  date: string;
  ticker: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockSummary {
  ticker: string;
  latest_price: number;
  '52_week_low': number;
  '52_week_high': number;
  price_position: number;
  avg_volume: number;
  weekly_return: number;
  monthly_return: number;
  yearly_return: number;
}

interface EnhancedStockPrice extends StockPrice {
  MA20: number | null;
  MA50: number | null;
  avg_20day_volume: number | null;
}

export async function GET(
  _request: NextRequest,
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
    if (!priceData) throw new Error('No price data found');

    // Get summary data
    const { data: summaryData, error: summaryError } = await supabase
      .from('stock_summaries')
      .select('*')
      .eq('ticker', ticker)
      .single();

    if (summaryError) throw summaryError;
    if (!summaryData) throw new Error('No summary data found');

    // Calculate moving averages
    const prices: EnhancedStockPrice[] = priceData.map(d => ({
      ...d as StockPrice,
      MA20: calculateMA(priceData as StockPrice[], d.date, 20),
      MA50: calculateMA(priceData as StockPrice[], d.date, 50),
      avg_20day_volume: calculateMA(priceData as StockPrice[], d.date, 20, 'volume')
    }));

    return NextResponse.json({
      data: {
        price_data: prices,
        volume_data: prices
      },
      summary: summaryData as StockSummary
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}

function calculateMA(data: StockPrice[], currentDate: string, period: number, field: keyof StockPrice = 'close'): number | null {
  const currentIndex = data.findIndex(d => d.date === currentDate);
  if (currentIndex < period - 1) return null;

  const slice = data.slice(currentIndex - period + 1, currentIndex + 1);
  const sum = slice.reduce((acc, curr) => acc + curr[field], 0);
  return sum / period;
}
