-- CreateTable
CREATE TABLE "ServiceResource" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "orgMemberId" TEXT,
    "legacyTechnicianId" TEXT,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceSkill" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crew" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewMember" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrewMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceResource_orgId_idx" ON "ServiceResource"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceResource_orgId_orgMemberId_key" ON "ServiceResource"("orgId", "orgMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceResource_orgId_legacyTechnicianId_key" ON "ServiceResource"("orgId", "legacyTechnicianId");

-- CreateIndex
CREATE INDEX "Skill_orgId_idx" ON "Skill"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_orgId_name_key" ON "Skill"("orgId", "name");

-- CreateIndex
CREATE INDEX "ResourceSkill_orgId_idx" ON "ResourceSkill"("orgId");

-- CreateIndex
CREATE INDEX "ResourceSkill_resourceId_idx" ON "ResourceSkill"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceSkill_skillId_idx" ON "ResourceSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceSkill_orgId_resourceId_skillId_key" ON "ResourceSkill"("orgId", "resourceId", "skillId");

-- CreateIndex
CREATE INDEX "Crew_orgId_idx" ON "Crew"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Crew_orgId_name_key" ON "Crew"("orgId", "name");

-- CreateIndex
CREATE INDEX "CrewMember_orgId_idx" ON "CrewMember"("orgId");

-- CreateIndex
CREATE INDEX "CrewMember_crewId_idx" ON "CrewMember"("crewId");

-- CreateIndex
CREATE INDEX "CrewMember_resourceId_idx" ON "CrewMember"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "CrewMember_orgId_crewId_resourceId_key" ON "CrewMember"("orgId", "crewId", "resourceId");

-- AddForeignKey
ALTER TABLE "ServiceResource" ADD CONSTRAINT "ServiceResource_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResource" ADD CONSTRAINT "ServiceResource_orgMemberId_fkey" FOREIGN KEY ("orgMemberId") REFERENCES "OrgMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceSkill" ADD CONSTRAINT "ResourceSkill_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceSkill" ADD CONSTRAINT "ResourceSkill_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "ServiceResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceSkill" ADD CONSTRAINT "ResourceSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crew" ADD CONSTRAINT "Crew_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewMember" ADD CONSTRAINT "CrewMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewMember" ADD CONSTRAINT "CrewMember_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewMember" ADD CONSTRAINT "CrewMember_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "ServiceResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
