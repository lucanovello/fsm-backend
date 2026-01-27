-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'DONE', 'SKIPPED');

-- CreateTable
CREATE TABLE "WorkTemplate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateTask" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateSkillRequirement" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateSkillRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderIncident" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "workOrderId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderTask" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "incidentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkTemplate_orgId_idx" ON "WorkTemplate"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkTemplate_orgId_name_key" ON "WorkTemplate"("orgId", "name");

-- CreateIndex
CREATE INDEX "TemplateTask_orgId_idx" ON "TemplateTask"("orgId");

-- CreateIndex
CREATE INDEX "TemplateTask_templateId_idx" ON "TemplateTask"("templateId");

-- CreateIndex
CREATE INDEX "TemplateSkillRequirement_orgId_idx" ON "TemplateSkillRequirement"("orgId");

-- CreateIndex
CREATE INDEX "TemplateSkillRequirement_templateId_idx" ON "TemplateSkillRequirement"("templateId");

-- CreateIndex
CREATE INDEX "TemplateSkillRequirement_skillId_idx" ON "TemplateSkillRequirement"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateSkillRequirement_orgId_templateId_skillId_key" ON "TemplateSkillRequirement"("orgId", "templateId", "skillId");

-- CreateIndex
CREATE INDEX "WorkOrderIncident_orgId_idx" ON "WorkOrderIncident"("orgId");

-- CreateIndex
CREATE INDEX "WorkOrderIncident_workOrderId_idx" ON "WorkOrderIncident"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderIncident_templateId_idx" ON "WorkOrderIncident"("templateId");

-- CreateIndex
CREATE INDEX "WorkOrderTask_orgId_idx" ON "WorkOrderTask"("orgId");

-- CreateIndex
CREATE INDEX "WorkOrderTask_incidentId_idx" ON "WorkOrderTask"("incidentId");

-- CreateIndex
CREATE INDEX "WorkOrderTask_status_idx" ON "WorkOrderTask"("status");

-- AddForeignKey
ALTER TABLE "WorkTemplate" ADD CONSTRAINT "WorkTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateTask" ADD CONSTRAINT "TemplateTask_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateTask" ADD CONSTRAINT "TemplateTask_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateSkillRequirement" ADD CONSTRAINT "TemplateSkillRequirement_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateSkillRequirement" ADD CONSTRAINT "TemplateSkillRequirement_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateSkillRequirement" ADD CONSTRAINT "TemplateSkillRequirement_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderIncident" ADD CONSTRAINT "WorkOrderIncident_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderIncident" ADD CONSTRAINT "WorkOrderIncident_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderIncident" ADD CONSTRAINT "WorkOrderIncident_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderTask" ADD CONSTRAINT "WorkOrderTask_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderTask" ADD CONSTRAINT "WorkOrderTask_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "WorkOrderIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
