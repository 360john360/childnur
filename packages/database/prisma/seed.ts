// ============================================================================
// NURSERY PLATFORM - DATABASE SEEDER
// Creates realistic demo data for Sunflower Nursery
// ============================================================================

import { PrismaClient, UserRole, UserStatus, Gender, DietaryType, FundingType, ChildStatus, DailyLogType, LogStatus, EYFSArea, CharacteristicOfLearning } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper to generate UUIDs
const uuid = () => randomUUID();

// Demo IDs for consistent references
const TENANT_ID = uuid();
const OWNER_USER_ID = uuid();
const MANAGER_USER_ID = uuid();
const PRACTITIONER_IDS = [uuid(), uuid(), uuid(), uuid()];
const ROOM_IDS = {
    buttercups: uuid(),
    butterflies: uuid(),
    bumblebees: uuid(),
};

// Staff IDs (for key person assignment)
const STAFF_IDS: string[] = [];

// Child IDs for reference
const CHILD_IDS = Array.from({ length: 12 }, () => uuid());
const GUARDIAN_IDS = Array.from({ length: 12 }, () => uuid());

async function main() {
    console.log('🌱 Starting database seed...\n');

    // Generate a proper bcrypt password hash for all demo accounts (password: demo123)
    const passwordHash = await bcrypt.hash('demo123', 10);
    console.log('🔐 Generated password hash for demo accounts');

    // Clear existing data (in development only)
    console.log('🧹 Clearing existing data...');
    await prisma.$executeRaw`TRUNCATE TABLE audit_logs, invoice_items, invoices, medication_records, consent_records, newsletters, messages, safeguarding_logs, accidents, two_year_checks, observations, attendance_records, daily_logs, emergency_contacts, child_guardians, guardians, children, staff, rooms, users, tenants CASCADE`;

    // =========================================================================
    // 1. CREATE TENANT
    // =========================================================================
    console.log('🏢 Creating tenant...');
    await prisma.tenant.create({
        data: {
            id: TENANT_ID,
            name: 'Sunflower Nursery',
            subdomain: 'sunflower',
            logoUrl: null,
            primaryColor: '#8b5cf6',
            secondaryColor: '#06b6d4',
            config: {
                modules: ['core', 'children', 'daily_logs', 'observations', 'safeguarding', 'billing'],
                eyfsVersion: '2024',
                stretchedFundingWeeks: 51,
            },
            isActive: true,
        },
    });

    // =========================================================================
    // 2. CREATE USERS
    // =========================================================================
    console.log('👤 Creating users...');

    // Owner
    await prisma.user.create({
        data: {
            id: OWNER_USER_ID,
            tenantId: TENANT_ID,
            email: 'owner@sunflower-nursery.co.uk',
            passwordHash, // In production, use bcrypt
            firstName: 'Sarah',
            lastName: 'Thompson',
            phone: '07700 900001',
            role: UserRole.OWNER,
            status: UserStatus.ACTIVE,
            permissions: ['*'], // Full access
        },
    });

    // Manager
    await prisma.user.create({
        data: {
            id: MANAGER_USER_ID,
            tenantId: TENANT_ID,
            email: 'jane.smith@sunflower-nursery.co.uk',
            passwordHash,
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '07700 900002',
            role: UserRole.MANAGER,
            status: UserStatus.ACTIVE,
            permissions: ['children:*', 'logs:*', 'observations:*', 'staff:read', 'billing:read'],
        },
    });

    // Demo login user
    await prisma.user.create({
        data: {
            tenantId: TENANT_ID,
            email: 'demo@nurseryhub.co.uk',
            passwordHash, // password: demo123
            firstName: 'Demo',
            lastName: 'User',
            role: UserRole.MANAGER,
            status: UserStatus.ACTIVE,
            permissions: ['children:*', 'logs:*', 'observations:*'],
        },
    });

    // Practitioners
    const practitionerData = [
        { firstName: 'Emma', lastName: 'Wilson', room: 'buttercups' },
        { firstName: 'Sophie', lastName: 'Davis', room: 'butterflies' },
        { firstName: 'Lucy', lastName: 'Brown', room: 'bumblebees' },
        { firstName: 'Olivia', lastName: 'Taylor', room: 'bumblebees' },
    ];

    for (let i = 0; i < practitionerData.length; i++) {
        const p = practitionerData[i];
        await prisma.user.create({
            data: {
                id: PRACTITIONER_IDS[i],
                tenantId: TENANT_ID,
                email: `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@sunflower-nursery.co.uk`,
                passwordHash,
                firstName: p.firstName,
                lastName: p.lastName,
                role: UserRole.PRACTITIONER,
                status: UserStatus.ACTIVE,
                permissions: ['children:read', 'logs:*', 'observations:create'],
            },
        });
    }

    // =========================================================================
    // 3. CREATE ROOMS
    // =========================================================================
    console.log('🏠 Creating rooms...');

    await prisma.room.createMany({
        data: [
            {
                id: ROOM_IDS.buttercups,
                tenantId: TENANT_ID,
                name: 'Buttercups',
                description: 'Baby room for 0-12 months',
                capacity: 8,
                minAgeMonths: 0,
                maxAgeMonths: 12,
                color: '#fbbf24',
                displayOrder: 1,
            },
            {
                id: ROOM_IDS.butterflies,
                tenantId: TENANT_ID,
                name: 'Butterflies',
                description: 'Toddler room for 12-24 months',
                capacity: 10,
                minAgeMonths: 12,
                maxAgeMonths: 24,
                color: '#8b5cf6',
                displayOrder: 2,
            },
            {
                id: ROOM_IDS.bumblebees,
                tenantId: TENANT_ID,
                name: 'Bumblebees',
                description: 'Pre-school room for 2-4 years',
                capacity: 16,
                minAgeMonths: 24,
                maxAgeMonths: 48,
                color: '#06b6d4',
                displayOrder: 3,
            },
        ],
    });

    // =========================================================================
    // 4. CREATE STAFF PROFILES
    // =========================================================================
    console.log('👩‍🏫 Creating staff profiles...');

    await prisma.staff.create({
        data: {
            id: uuid(),
            tenantId: TENANT_ID,
            userId: MANAGER_USER_ID,
            roomId: null, // Manager oversees all rooms
            employeeNumber: 'SF001',
            jobTitle: 'Nursery Manager',
            startDate: new Date('2020-01-15'),
            qualificationLevel: 6,
            qualifications: [
                { name: 'BA Early Childhood Studies', date: '2018-07-01' },
                { name: 'Level 3 Diploma', date: '2015-06-01' },
            ],
            dbsNumber: 'DBS123456789',
            dbsIssueDate: new Date('2023-01-10'),
            firstAidCertified: true,
            firstAidExpiry: new Date('2025-06-15'),
            paediatricFirstAid: true,
            safeguardingTrainingDate: new Date('2024-03-01'),
            isDSL: true,
            contractType: 'Permanent',
            weeklyHours: 40,
        },
    });

    for (let i = 0; i < practitionerData.length; i++) {
        const p = practitionerData[i];
        const staffId = uuid();
        STAFF_IDS.push(staffId);

        await prisma.staff.create({
            data: {
                id: staffId,
                tenantId: TENANT_ID,
                userId: PRACTITIONER_IDS[i],
                roomId: ROOM_IDS[p.room as keyof typeof ROOM_IDS],
                employeeNumber: `SF00${i + 2}`,
                jobTitle: 'Early Years Practitioner',
                startDate: new Date('2022-09-01'),
                qualificationLevel: 3,
                qualifications: [
                    { name: 'Level 3 Diploma in Childcare', date: '2021-06-01' },
                ],
                dbsNumber: `DBS98765${i}321`,
                dbsIssueDate: new Date('2022-08-15'),
                firstAidCertified: true,
                firstAidExpiry: new Date('2025-08-15'),
                paediatricFirstAid: true,
                safeguardingTrainingDate: new Date('2024-01-15'),
                isDSL: false,
                contractType: 'Permanent',
                weeklyHours: 37.5,
            },
        });
    }

    // =========================================================================
    // 5. CREATE CHILDREN
    // =========================================================================
    console.log('👶 Creating children...');

    const childrenData = [
        // Buttercups (babies)
        { firstName: 'Amelia', lastName: 'Brown', dob: new Date('2024-06-15'), room: 'buttercups', allergies: [], dietary: [] },
        { firstName: 'Noah', lastName: 'Johnson', dob: new Date('2024-04-22'), room: 'buttercups', allergies: [], dietary: [DietaryType.HALAL] },
        { firstName: 'Isla', lastName: 'Williams', dob: new Date('2024-03-10'), room: 'buttercups', allergies: [{ name: 'Dairy', severity: 'moderate', action: 'Avoid all dairy products' }], dietary: [DietaryType.DAIRY_FREE] },

        // Butterflies (toddlers)
        { firstName: 'Oliver', lastName: 'Thompson', dob: new Date('2023-08-05'), room: 'butterflies', allergies: [], dietary: [] },
        { firstName: 'Lily', lastName: 'Davis', dob: new Date('2023-05-18'), room: 'butterflies', allergies: [{ name: 'Peanuts', severity: 'severe', action: 'EpiPen required. Call 999 immediately.' }], dietary: [DietaryType.NUT_FREE] },
        { firstName: 'Harry', lastName: 'Wilson', dob: new Date('2023-09-12'), room: 'butterflies', allergies: [], dietary: [DietaryType.VEGETARIAN] },
        { firstName: 'Sophia', lastName: 'Taylor', dob: new Date('2023-06-25'), room: 'butterflies', allergies: [], dietary: [] },

        // Bumblebees (pre-school)
        { firstName: 'George', lastName: 'Anderson', dob: new Date('2022-02-14'), room: 'bumblebees', allergies: [], dietary: [] },
        { firstName: 'Mia', lastName: 'Martin', dob: new Date('2022-04-08'), room: 'bumblebees', allergies: [], dietary: [DietaryType.GLUTEN_FREE] },
        { firstName: 'Jack', lastName: 'White', dob: new Date('2022-01-30'), room: 'bumblebees', allergies: [{ name: 'Eggs', severity: 'mild', action: 'Avoid eggs in cooked foods' }], dietary: [DietaryType.EGG_FREE] },
        { firstName: 'Emily', lastName: 'Harris', dob: new Date('2021-11-22'), room: 'bumblebees', allergies: [], dietary: [] },
        { firstName: 'Charlie', lastName: 'Clark', dob: new Date('2022-03-05'), room: 'bumblebees', allergies: [], dietary: [] },
    ];

    for (let i = 0; i < childrenData.length; i++) {
        const c = childrenData[i];
        await prisma.child.create({
            data: {
                id: CHILD_IDS[i],
                tenantId: TENANT_ID,
                roomId: ROOM_IDS[c.room as keyof typeof ROOM_IDS],
                firstName: c.firstName,
                lastName: c.lastName,
                dateOfBirth: c.dob,
                gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
                aboutMe: `${c.firstName} loves playing and learning new things!`,
                languagesSpoken: ['English'],
                homeLanguage: 'English',
                allergies: c.allergies,
                hasAllergy: c.allergies.length > 0,
                dietaryRequirements: c.dietary,
                expectedDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'].slice(0, 3 + Math.floor(Math.random() * 3)),
                expectedHoursPerWeek: 15 + Math.floor(Math.random() * 20),
                keyPersonId: STAFF_IDS[i % STAFF_IDS.length],
                fundingType: i > 5 ? FundingType.UNIVERSAL_15 : FundingType.NONE,
                fundingHours: i > 5 ? 15 : null,
                stretchedFunding: i > 7,
                startDate: new Date('2024-09-01'),
                status: ChildStatus.ACTIVE,
            },
        });
    }

    // =========================================================================
    // 6. CREATE GUARDIANS
    // =========================================================================
    console.log('👨‍👩‍👧 Creating guardians...');

    for (let i = 0; i < childrenData.length; i++) {
        const c = childrenData[i];

        // Create parent user (for portal access)
        const parentUserId = uuid();
        await prisma.user.create({
            data: {
                id: parentUserId,
                tenantId: TENANT_ID,
                email: `${c.firstName.toLowerCase()}.parent@email.com`,
                passwordHash,
                firstName: 'Parent',
                lastName: c.lastName,
                role: UserRole.PARENT,
                status: UserStatus.ACTIVE,
                permissions: ['children:read:own', 'logs:read:own', 'observations:read:own', 'messages:*:own'],
            },
        });

        // Create guardian
        await prisma.guardian.create({
            data: {
                id: GUARDIAN_IDS[i],
                tenantId: TENANT_ID,
                userId: parentUserId,
                title: i % 2 === 0 ? 'Mrs' : 'Mr',
                firstName: i % 2 === 0 ? 'Sarah' : 'David',
                lastName: c.lastName,
                email: `${c.firstName.toLowerCase()}.parent@email.com`,
                phone: `07700 90${1000 + i}`,
                mobile: `07700 90${1000 + i}`,
                addressLine1: `${10 + i} Oak Street`,
                city: 'London',
                postcode: `SW1A ${i}AA`,
                relationship: i % 2 === 0 ? 'Mother' : 'Father',
                isBillPayer: true,
            },
        });

        // Link child to guardian
        await prisma.childGuardian.create({
            data: {
                id: uuid(),
                tenantId: TENANT_ID,
                childId: CHILD_IDS[i],
                guardianId: GUARDIAN_IDS[i],
                isPrimary: true,
                authorizedToCollect: true,
                receiveDailyUpdates: true,
                receiveNewsletters: true,
            },
        });

        // Add emergency contact
        await prisma.emergencyContact.create({
            data: {
                id: uuid(),
                tenantId: TENANT_ID,
                childId: CHILD_IDS[i],
                name: `Grandma ${c.lastName}`,
                relationship: 'Grandmother',
                phone: `07700 88${i}000`,
                authorizedToCollect: true,
                priority: 2,
            },
        });
    }

    // =========================================================================
    // 7. CREATE SAMPLE DAILY LOGS
    // =========================================================================
    console.log('📝 Creating daily logs...');

    const today = new Date();

    for (let i = 0; i < 5; i++) {
        const childId = CHILD_IDS[i];

        // Nappy log
        await prisma.dailyLog.create({
            data: {
                id: uuid(),
                tenantId: TENANT_ID,
                childId,
                authorId: PRACTITIONER_IDS[i % PRACTITIONER_IDS.length],
                type: DailyLogType.NAPPY,
                timestamp: new Date(today.getTime() - Math.random() * 3600000),
                data: { result: 'WET', cream: true },
                notes: null,
                mediaUrls: [],
                status: LogStatus.PUBLISHED,
                publishedAt: new Date(),
            },
        });

        // Meal log
        await prisma.dailyLog.create({
            data: {
                id: uuid(),
                tenantId: TENANT_ID,
                childId,
                authorId: PRACTITIONER_IDS[i % PRACTITIONER_IDS.length],
                type: DailyLogType.MEAL,
                timestamp: new Date(today.setHours(8, 30, 0)),
                data: { meal: 'Breakfast', menu: 'Porridge with fruit', quantity: 'ALL' },
                notes: 'Enjoyed breakfast today!',
                mediaUrls: [],
                status: LogStatus.PUBLISHED,
                publishedAt: new Date(),
            },
        });

        // Activity/Note
        await prisma.dailyLog.create({
            data: {
                id: uuid(),
                tenantId: TENANT_ID,
                childId,
                authorId: PRACTITIONER_IDS[i % PRACTITIONER_IDS.length],
                type: DailyLogType.ACTIVITY,
                timestamp: new Date(today.setHours(10, 0, 0)),
                data: { activity: 'Outdoor play' },
                notes: 'Had a wonderful time in the garden exploring nature!',
                mediaUrls: [],
                status: LogStatus.PUBLISHED,
                publishedAt: new Date(),
            },
        });
    }

    // =========================================================================
    // 8. CREATE SAMPLE OBSERVATIONS
    // =========================================================================
    console.log('🔍 Creating observations...');

    await prisma.observation.create({
        data: {
            id: uuid(),
            tenantId: TENANT_ID,
            childId: CHILD_IDS[7], // George
            authorId: PRACTITIONER_IDS[2],
            title: 'Building a tall tower',
            narrative: 'George spent 15 minutes carefully stacking blocks to build the tallest tower in the class. When it fell, he showed resilience and started again with a different approach, this time building a wider base.',
            mediaUrls: [],
            areasOfLearning: [EYFSArea.MATHEMATICS, EYFSArea.PHYSICAL_DEVELOPMENT],
            characteristics: [CharacteristicOfLearning.ACTIVE_LEARNING, CharacteristicOfLearning.CREATING_AND_THINKING_CRITICALLY],
            nextSteps: 'Introduce counting while stacking. Encourage peer collaboration on building projects.',
            status: LogStatus.PUBLISHED,
            publishedAt: new Date(),
            observedAt: new Date(),
        },
    });

    await prisma.observation.create({
        data: {
            id: uuid(),
            tenantId: TENANT_ID,
            childId: CHILD_IDS[8], // Mia
            authorId: PRACTITIONER_IDS[2],
            title: 'Story time engagement',
            narrative: 'Mia sat quietly during story time, completely absorbed in "The Very Hungry Caterpillar". She noticed details in the illustrations that other children missed and asked thoughtful questions about the caterpillar\'s transformation.',
            mediaUrls: [],
            areasOfLearning: [EYFSArea.COMMUNICATION_AND_LANGUAGE, EYFSArea.LITERACY],
            characteristics: [CharacteristicOfLearning.PLAYING_AND_EXPLORING],
            nextSteps: 'Provide more complex picture books. Encourage Mia to retell stories to peers.',
            status: LogStatus.PUBLISHED,
            publishedAt: new Date(),
            observedAt: new Date(Date.now() - 86400000), // Yesterday
        },
    });

    // =========================================================================
    // 9. CREATE ATTENDANCE RECORDS
    // =========================================================================
    console.log('📋 Creating attendance records...');

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 8; i++) {
        await prisma.attendanceRecord.create({
            data: {
                id: uuid(),
                tenantId: TENANT_ID,
                childId: CHILD_IDS[i],
                date: todayDate,
                checkInTime: new Date(todayDate.getTime() + 8 * 3600000 + Math.random() * 3600000), // Between 8-9am
                checkedInBy: PRACTITIONER_IDS[i % PRACTITIONER_IDS.length],
                bookedSession: 'Full Day',
                status: 'CHECKED_IN',
            },
        });
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 1 Tenant (Sunflower Nursery)');
    console.log('   - 7 Users (Owner, Manager, 4 Practitioners, Demo)');
    console.log('   - 3 Rooms');
    console.log('   - 12 Children with guardians');
    console.log('   - 15+ Daily logs');
    console.log('   - 2 Observations');
    console.log('   - 8 Attendance records');
    console.log('\n🔐 Demo Login:');
    console.log('   Email: demo@nurseryhub.co.uk');
    console.log('   Password: demo123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
