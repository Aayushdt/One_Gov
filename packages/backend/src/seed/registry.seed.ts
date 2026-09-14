import { PrismaClient, DataCategory } from '@prisma/client';

export const MANIFESTS_SEED = [
  {
    slug: 'identity-uidai',
    category: DataCategory.IDENTITY,
    baseUrl: 'http://mock-identity:4001',
    authMethod: 'none',
    authConfig: { envVar: 'IDENTITY_API_URL', pathTemplate: '/citizens/:id', rateLimit: 100 },
    fieldSchema: {
      type: 'object',
      required: ['source', 'verified', 'fullName', 'dateOfBirth', 'gender', 'maskedId', 'docType'],
    },
    isActive: true,
  },
  {
    slug: 'education-nad',
    category: DataCategory.EDUCATION,
    baseUrl: 'http://mock-education:4002',
    authMethod: 'none',
    authConfig: { envVar: 'EDUCATION_API_URL', pathTemplate: '/students/:id', rateLimit: 100 },
    fieldSchema: {
      type: 'object',
      required: ['source', 'institutionName', 'enrollmentStatus', 'program'],
    },
    isActive: true,
  },
  {
    slug: 'revenue-cbdt',
    category: DataCategory.INCOME,
    baseUrl: 'http://mock-revenue:4003',
    authMethod: 'none',
    authConfig: { envVar: 'REVENUE_API_URL', pathTemplate: '/taxpayers/:id', rateLimit: 100 },
    fieldSchema: {
      type: 'object',
      required: ['source', 'incomeBand', 'taxYear', 'panMasked', 'filingStatus'],
    },
    isActive: true,
  },
  {
    slug: 'transport-rto',
    category: DataCategory.TRANSPORT,
    baseUrl: 'http://mock-revenue:4003',
    authMethod: 'none',
    authConfig: { envVar: 'REVENUE_API_URL', pathTemplate: '/transport/:id', rateLimit: 100 },
    fieldSchema: {
      type: 'object',
      required: ['source', 'dlNumber', 'dlStatus', 'cleanDrivingRecord'],
    },
    isActive: true,
  },
  {
    slug: 'police-cctns',
    category: DataCategory.POLICE,
    baseUrl: 'http://mock-identity:4001',
    authMethod: 'none',
    authConfig: { envVar: 'IDENTITY_API_URL', pathTemplate: '/police/:id', rateLimit: 100 },
    fieldSchema: {
      type: 'object',
      required: ['source', 'clearanceStatus', 'incidentCount', 'jurisdictionStation'],
    },
    isActive: true,
  },
  {
    slug: 'banking-dbt',
    category: DataCategory.BANKING,
    baseUrl: 'http://mock-revenue:4003',
    authMethod: 'none',
    authConfig: { envVar: 'REVENUE_API_URL', pathTemplate: '/banking/:id', rateLimit: 100 },
    fieldSchema: {
      type: 'object',
      required: ['source', 'bankName', 'maskedAccount', 'kycStatus', 'dbtActive'],
    },
    isActive: true,
  },
  {
    slug: 'welfare-pds',
    category: DataCategory.WELFARE,
    baseUrl: 'http://mock-education:4002',
    authMethod: 'none',
    authConfig: { envVar: 'EDUCATION_API_URL', pathTemplate: '/welfare/:id', rateLimit: 100 },
    fieldSchema: {
      type: 'object',
      required: ['source', 'bplCardHolder', 'rationCardNumber'],
    },
    isActive: true,
  },
  {
    slug: 'municipal-property',
    category: DataCategory.MUNICIPAL,
    baseUrl: 'http://mock-identity:4001',
    authMethod: 'none',
    authConfig: { envVar: 'IDENTITY_API_URL', pathTemplate: '/municipal/:id', rateLimit: 100 },
    fieldSchema: {
      type: 'object',
      required: ['source', 'propertyId', 'propertyTaxClearance', 'zone'],
    },
    isActive: true,
  },
];

export const SERVICES_SEED = [
  {
    serviceType: 'SCHOLARSHIP',
    displayName: 'STEM / Higher Education Scholarship',
    steps: [
      { order: 1, stateName: 'IDENTITY_VERIFY', connectorSlug: 'identity-uidai', category: DataCategory.IDENTITY },
      { order: 2, stateName: 'EDUCATION_VERIFY', connectorSlug: 'education-nad', category: DataCategory.EDUCATION },
      { order: 3, stateName: 'INCOME_VERIFY', connectorSlug: 'revenue-cbdt', category: DataCategory.INCOME },
    ],
    eligibilityRules: {
      rules: [
        { field: 'income.meetsThreshold', op: '==', value: true, failureReason: 'INCOME_CEILING_EXCEEDED' },
        { field: 'education.enrollmentStatus', op: '==', value: 'ACTIVE', failureReason: 'ACTIVE_ENROLLMENT_REQUIRED' },
      ],
      defaultSuccessReason: 'MEETS_ALL_CRITERIA',
    },
    isActive: true,
  },
  {
    serviceType: 'TRANSPORT',
    displayName: 'Commercial Driving & Transport Clearance',
    steps: [
      { order: 1, stateName: 'IDENTITY_VERIFY', connectorSlug: 'identity-uidai', category: DataCategory.IDENTITY },
      { order: 2, stateName: 'TRANSPORT_VERIFY', connectorSlug: 'transport-rto', category: DataCategory.TRANSPORT },
      { order: 3, stateName: 'POLICE_VERIFY', connectorSlug: 'police-cctns', category: DataCategory.POLICE },
      { order: 4, stateName: 'BANKING_VERIFY', connectorSlug: 'banking-dbt', category: DataCategory.BANKING },
      { order: 5, stateName: 'MUNICIPAL_VERIFY', connectorSlug: 'municipal-property', category: DataCategory.MUNICIPAL },
    ],
    eligibilityRules: {
      rules: [
        { field: 'transport.dlStatus', op: '==', value: 'VALID', failureReason: 'DRIVING_LICENCE_EXPIRED' },
        { field: 'transport.cleanDrivingRecord', op: '==', value: true, failureReason: 'UNPAID_TRAFFIC_CHALLANS' },
        { field: 'police.clearanceStatus', op: '==', value: 'CLEARED', failureReason: 'POLICE_CLEARANCE_PENDING' },
        { field: 'municipal.propertyTaxClearance', op: '==', value: true, failureReason: 'PROPERTY_TAX_ENCUMBRANCE' },
        { field: 'banking.kycStatus', op: '==', value: 'VERIFIED', failureReason: 'BANK_KYC_REQUIRED' },
      ],
      defaultSuccessReason: 'TRANSPORT_CLEARANCE_APPROVED',
    },
    isActive: true,
  },
  {
    serviceType: 'WELFARE',
    displayName: 'Integrated Social Welfare & DBT Assistance',
    steps: [
      { order: 1, stateName: 'IDENTITY_VERIFY', connectorSlug: 'identity-uidai', category: DataCategory.IDENTITY },
      { order: 2, stateName: 'INCOME_VERIFY', connectorSlug: 'revenue-cbdt', category: DataCategory.INCOME },
      { order: 3, stateName: 'WELFARE_VERIFY', connectorSlug: 'welfare-pds', category: DataCategory.WELFARE },
      { order: 4, stateName: 'BANKING_VERIFY', connectorSlug: 'banking-dbt', category: DataCategory.BANKING },
    ],
    eligibilityRules: {
      rules: [
        {
          or: [
            { field: 'income.eligibilityBand', op: '==', value: 'LOW' },
            { field: 'welfare.bplStatus', op: '==', value: true },
          ],
          failureReason: 'INCOME_CEILING_EXCEEDED',
        },
        { field: 'banking.dbtEnabled', op: '==', value: true, failureReason: 'DBT_BANK_LINK_REQUIRED' },
      ],
      defaultSuccessReason: 'WELFARE_BENEFIT_APPROVED',
    },
    isActive: true,
  },
];

export async function seedRegistry(prisma: PrismaClient) {
  console.log('Seeding Connector Registry & Service Definitions...');

  for (const m of MANIFESTS_SEED) {
    await prisma.connectorManifest.upsert({
      where: { slug: m.slug },
      update: {
        category: m.category,
        baseUrl: m.baseUrl,
        authMethod: m.authMethod,
        authConfig: m.authConfig as any,
        fieldSchema: m.fieldSchema as any,
        isActive: m.isActive,
      },
      create: {
        slug: m.slug,
        category: m.category,
        baseUrl: m.baseUrl,
        authMethod: m.authMethod,
        authConfig: m.authConfig as any,
        fieldSchema: m.fieldSchema as any,
        isActive: m.isActive,
      },
    });
    console.log(`  ✓ ConnectorManifest: ${m.slug} (${m.category})`);
  }

  for (const s of SERVICES_SEED) {
    const serviceDef = await prisma.serviceDefinition.upsert({
      where: { serviceType: s.serviceType },
      update: {
        displayName: s.displayName,
        steps: s.steps as any,
        eligibilityRules: s.eligibilityRules as any,
        isActive: s.isActive,
      },
      create: {
        serviceType: s.serviceType,
        displayName: s.displayName,
        steps: s.steps as any,
        eligibilityRules: s.eligibilityRules as any,
        isActive: s.isActive,
      },
    });

    // Also sync WorkflowStep rows
    await prisma.workflowStep.deleteMany({ where: { serviceDefId: serviceDef.id } });
    for (const step of s.steps) {
      await prisma.workflowStep.create({
        data: {
          serviceDefId: serviceDef.id,
          order: step.order,
          stateName: step.stateName,
          connectorSlug: step.connectorSlug,
          category: step.category,
        },
      });
    }
    console.log(`  ✓ ServiceDefinition: ${s.serviceType} with ${s.steps.length} steps`);
  }
}
