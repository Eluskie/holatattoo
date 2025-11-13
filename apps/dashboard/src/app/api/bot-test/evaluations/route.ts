import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for evaluations
// In production, you'd store this in DB
let evaluations: any[] = [];

export interface Evaluation {
  id: string;
  templateId: string;
  templateName: string;
  configName: string;
  timestamp: string;
  results: {
    messages: Array<{ role: string; content: string }>;
    finalData: any;
    status: string;
    messageCount: number;
    qualified: boolean;
    toolsUsed: string[];
  };
  metrics: {
    duration: number;
    userMessages: number;
    botMessages: number;
    toolCalls: number;
  };
}

// GET - List all evaluations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('templateId');
    const configName = searchParams.get('configName');

    let filtered = evaluations;

    if (templateId) {
      filtered = filtered.filter(e => e.templateId === templateId);
    }

    if (configName) {
      filtered = filtered.filter(e => e.configName === configName);
    }

    // Sort by timestamp desc
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ evaluations: filtered });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Save evaluation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, templateName, configName, results, metrics } = body;

    const evaluation: Evaluation = {
      id: `eval-${Date.now()}`,
      templateId,
      templateName,
      configName,
      timestamp: new Date().toISOString(),
      results,
      metrics
    };

    evaluations.push(evaluation);

    // Keep only last 100 evaluations to avoid memory issues
    if (evaluations.length > 100) {
      evaluations = evaluations.slice(-100);
    }

    return NextResponse.json({ evaluation });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Clear all evaluations
export async function DELETE(req: NextRequest) {
  try {
    evaluations = [];
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

