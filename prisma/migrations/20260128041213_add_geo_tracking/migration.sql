-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "geoRetentionDays" INTEGER NOT NULL DEFAULT 365;

-- CreateTable
CREATE TABLE "GeoDevice" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "serviceResourceId" TEXT NOT NULL,
    "deviceIdentifier" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoPing" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "serviceResourceId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracyMeters" DOUBLE PRECISION,
    "altitudeMeters" DOUBLE PRECISION,
    "speedMps" DOUBLE PRECISION,
    "headingDeg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoPing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeoDevice_orgId_idx" ON "GeoDevice"("orgId");

-- CreateIndex
CREATE INDEX "GeoDevice_serviceResourceId_idx" ON "GeoDevice"("serviceResourceId");

-- CreateIndex
CREATE INDEX "GeoDevice_orgId_serviceResourceId_idx" ON "GeoDevice"("orgId", "serviceResourceId");

-- CreateIndex
CREATE UNIQUE INDEX "GeoDevice_orgId_deviceIdentifier_key" ON "GeoDevice"("orgId", "deviceIdentifier");

-- CreateIndex
CREATE INDEX "GeoPing_orgId_recordedAt_idx" ON "GeoPing"("orgId", "recordedAt");

-- CreateIndex
CREATE INDEX "GeoPing_orgId_deviceId_recordedAt_idx" ON "GeoPing"("orgId", "deviceId", "recordedAt");

-- CreateIndex
CREATE INDEX "GeoPing_orgId_serviceResourceId_recordedAt_idx" ON "GeoPing"("orgId", "serviceResourceId", "recordedAt");

-- AddForeignKey
ALTER TABLE "GeoDevice" ADD CONSTRAINT "GeoDevice_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoDevice" ADD CONSTRAINT "GeoDevice_serviceResourceId_fkey" FOREIGN KEY ("serviceResourceId") REFERENCES "ServiceResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoPing" ADD CONSTRAINT "GeoPing_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoPing" ADD CONSTRAINT "GeoPing_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "GeoDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoPing" ADD CONSTRAINT "GeoPing_serviceResourceId_fkey" FOREIGN KEY ("serviceResourceId") REFERENCES "ServiceResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
