import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test studio
  const studio = await prisma.studio.upsert({
    where: { email: 'test@holatattoostudio.com' },
    update: {},
    create: {
      name: 'Hola Tattoo Studio',
      email: 'test@holatattoostudio.com',
      whatsappNumber: 'whatsapp:+14155238886', // Twilio sandbox number
      webhookUrl: 'https://webhook.site/your-unique-url', // Replace with your test webhook
    }
  });

  console.log('✅ Created studio:', studio.name);

  // Create bot configuration with default questions
  const botConfig = await prisma.botConfig.upsert({
    where: { studioId: studio.id },
    update: {
      welcomeMessage: "Ei 👋",
      brandingColor: '#FF6B6B',
      questions: [
        {
          id: 1,
          text: "Tens +18 anys i està bé usar les teves respostes?",
          field: 'consent',
          type: 'choice',
          choices: ['Sí', 'No']
        },
        {
          id: 2,
          text: "Quin estil t'agrada: tradicional, realisme, línia fina, neo-tradicional, abstracte, o encara no estàs segur?",
          field: 'style',
          type: 'choice',
          choices: ['Tradicional', 'Realisme', 'Línia fina', 'Neo-tradicional', 'Abstracte', 'No estic segur']
        },
        {
          id: 3,
          text: "On al cos, i quina mida? S fins 5cm, M 5-12cm, L 12-20cm, XL secció completa (mitja màniga)",
          field: 'placement_size',
          type: 'text'
        },
        {
          id: 4,
          text: "Prefereixes color o blanc i negre?",
          field: 'color',
          type: 'choice',
          choices: ['Color', 'Blanc i negre', 'No estic segur']
        },
        {
          id: 5,
          text: "Quin pressupost tens en ment: menys de 150€, 150-300€, o més de 300€?",
          field: 'budget',
          type: 'choice',
          choices: ['Menys de 150€', '150-300€', 'Més de 300€']
        },
        {
          id: 6,
          text: "Vols reservar en les pròximes 2-4 setmanes, o més endavant?",
          field: 'timing',
          type: 'choice',
          choices: ['2-4 setmanes', 'Més endavant', 'Urgent (demà/aquesta setmana)']
        },
        {
          id: 7,
          text: "Pots compartir una imatge de referència si vols. Evita contingut explícit. L'usarem només per aquesta reserva.",
          field: 'reference_image',
          type: 'text'
        },
        {
          id: 8,
          text: "Com et dius?",
          field: 'name',
          type: 'text'
        }
      ]
    },
    create: {
      studioId: studio.id,
      welcomeMessage: "Ei 👋",
      brandingColor: '#FF6B6B',
      questions: [
        {
          id: 1,
          text: "Tens +18 anys i està bé usar les teves respostes?",
          field: 'consent',
          type: 'choice',
          choices: ['Sí', 'No']
        },
        {
          id: 2,
          text: "Quin estil t'agrada: tradicional, realisme, línia fina, neo-tradicional, abstracte, o encara no estàs segur?",
          field: 'style',
          type: 'choice',
          choices: ['Tradicional', 'Realisme', 'Línia fina', 'Neo-tradicional', 'Abstracte', 'No estic segur']
        },
        {
          id: 3,
          text: "On al cos, i quina mida? S fins 5cm, M 5-12cm, L 12-20cm, XL secció completa (mitja màniga)",
          field: 'placement_size',
          type: 'text'
        },
        {
          id: 4,
          text: "Prefereixes color o blanc i negre?",
          field: 'color',
          type: 'choice',
          choices: ['Color', 'Blanc i negre', 'No estic segur']
        },
        {
          id: 5,
          text: "Quin pressupost tens en ment: menys de 150€, 150-300€, o més de 300€?",
          field: 'budget',
          type: 'choice',
          choices: ['Menys de 150€', '150-300€', 'Més de 300€']
        },
        {
          id: 6,
          text: "Vols reservar en les pròximes 2-4 setmanes, o més endavant?",
          field: 'timing',
          type: 'choice',
          choices: ['2-4 setmanes', 'Més endavant', 'Urgent (demà/aquesta setmana)']
        },
        {
          id: 7,
          text: "Pots compartir una imatge de referència si vols. Evita contingut explícit. L'usarem només per aquesta reserva.",
          field: 'reference_image',
          type: 'text'
        },
        {
          id: 8,
          text: "Com et dius?",
          field: 'name',
          type: 'text'
        }
      ]
    }
  });

  console.log('✅ Created bot config for studio');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
