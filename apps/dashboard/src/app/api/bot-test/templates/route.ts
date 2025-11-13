import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@hola-tattoo/database';

// Predefined test templates
const DEFAULT_TEMPLATES = [
  {
    id: 'simple-tattoo',
    name: 'Simple Tattoo Request',
    description: 'User wants a simple tattoo with all info upfront',
    messages: [
      'hola!',
      'vull un drac al braç',
      'realisme',
      'Joan'
    ],
    expectedOutcome: {
      qualified: true,
      hasDescription: true,
      hasPlacement: true,
      hasName: true
    }
  },
  {
    id: 'complex-interaction',
    name: 'Complex Interaction',
    description: 'User asks questions first, then provides info',
    messages: [
      'hola',
      'a on esteu?',
      'quin horari teniu?',
      'vull fer-me un tattoo',
      'una rosa al braç esquerre',
      'blanc i negre',
      'Maria'
    ],
    expectedOutcome: {
      qualified: true,
      hasDescription: true,
      hasPlacement: true,
      hasName: true,
      hasColor: true
    }
  },
  {
    id: 'price-question',
    name: 'Price Question',
    description: 'User asks about price during conversation',
    messages: [
      'hola',
      'vull un tattoo',
      'quan costaria aprox?',
      'un escut del barça al pit',
      'Pepet'
    ],
    expectedOutcome: {
      qualified: true,
      answeredPriceQuestion: true
    }
  },
  {
    id: 'incomplete-info',
    name: 'Incomplete Info',
    description: 'User provides partial info and leaves',
    messages: [
      'hola',
      'vull un tattoo',
      'una rosa',
      'adeu'
    ],
    expectedOutcome: {
      qualified: false,
      hasDescription: true,
      hasPlacement: false
    }
  },
  {
    id: 'change-mind',
    name: 'Change Mind',
    description: 'User changes their mind about details',
    messages: [
      'vull un drac al braç',
      'no espera, millor una rosa',
      'al pit millor',
      'blanc i negre',
      'Joan'
    ],
    expectedOutcome: {
      qualified: true,
      finalDescription: 'rosa',
      finalPlacement: 'pit'
    }
  }
];

// GET - List all templates
export async function GET(req: NextRequest) {
  try {
    // You could store these in DB later, for now return defaults
    return NextResponse.json({ templates: DEFAULT_TEMPLATES });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create custom template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, messages, expectedOutcome } = body;

    // For now, just return success
    // Later you can store in DB if needed
    const template = {
      id: `custom-${Date.now()}`,
      name,
      description,
      messages,
      expectedOutcome,
      custom: true
    };

    return NextResponse.json({ template });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

