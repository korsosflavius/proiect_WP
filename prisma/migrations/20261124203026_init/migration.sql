BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[VendorProfile] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [businessName] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max) NOT NULL,
    [city] NVARCHAR(1000) NOT NULL,
    [basePrice] FLOAT(53) NOT NULL,
    [phone] NVARCHAR(1000),
    [capacity] INT,
    [imageUrl] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [VendorProfile_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [VendorProfile_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [VendorProfile_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[VendorImage] (
    [id] NVARCHAR(1000) NOT NULL,
    [vendorId] NVARCHAR(1000) NOT NULL,
    [url] NVARCHAR(1000) NOT NULL,
    [caption] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [VendorImage_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [VendorImage_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[VendorPackage] (
    [id] NVARCHAR(1000) NOT NULL,
    [vendorId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(2000),
    [price] FLOAT(53) NOT NULL,
    CONSTRAINT [VendorPackage_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Booking] (
    [id] NVARCHAR(1000) NOT NULL,
    [weddingId] NVARCHAR(1000) NOT NULL,
    [vendorId] NVARCHAR(1000) NOT NULL,
    [packageId] NVARCHAR(1000),
    [eventDate] DATE NOT NULL,
    [agreedPrice] FLOAT(53) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Booking_status_df] DEFAULT 'PENDING',
    [notes] NVARCHAR(2000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Booking_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Booking_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BlockedDate] (
    [id] NVARCHAR(1000) NOT NULL,
    [vendorId] NVARCHAR(1000) NOT NULL,
    [date] DATE NOT NULL,
    [reason] NVARCHAR(1000),
    CONSTRAINT [BlockedDate_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [BlockedDate_vendorId_date_key] UNIQUE NONCLUSTERED ([vendorId],[date])
);

-- CreateTable
CREATE TABLE [dbo].[Wedding] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [coupleNames] NVARCHAR(1000) NOT NULL,
    [weddingDate] DATE NOT NULL,
    [totalBudget] FLOAT(53) NOT NULL CONSTRAINT [Wedding_totalBudget_df] DEFAULT 0,
    [expectedGuests] INT NOT NULL CONSTRAINT [Wedding_expectedGuests_df] DEFAULT 100,
    [phone] NVARCHAR(1000),
    [venueName] NVARCHAR(1000),
    CONSTRAINT [Wedding_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Wedding_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[BudgetItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [weddingId] NVARCHAR(1000) NOT NULL,
    [label] NVARCHAR(1000) NOT NULL,
    [amount] FLOAT(53) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL CONSTRAINT [BudgetItem_category_df] DEFAULT 'Altele',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BudgetItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BudgetItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Guest] (
    [id] NVARCHAR(1000) NOT NULL,
    [weddingId] NVARCHAR(1000) NOT NULL,
    [fullName] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [group] NVARCHAR(1000),
    [rsvpStatus] NVARCHAR(1000) NOT NULL CONSTRAINT [Guest_rsvpStatus_df] DEFAULT 'CONFIRMED',
    [menuType] NVARCHAR(1000) NOT NULL CONSTRAINT [Guest_menuType_df] DEFAULT 'STANDARD',
    [allergies] NVARCHAR(1000) NOT NULL CONSTRAINT [Guest_allergies_df] DEFAULT '',
    [notes] NVARCHAR(1000),
    [tableId] NVARCHAR(1000),
    [seatIndex] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Guest_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Guest_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[VenueTable] (
    [id] NVARCHAR(1000) NOT NULL,
    [weddingId] NVARCHAR(1000) NOT NULL,
    [label] NVARCHAR(1000) NOT NULL,
    [shape] NVARCHAR(1000) NOT NULL,
    [capacity] INT NOT NULL CONSTRAINT [VenueTable_capacity_df] DEFAULT 8,
    [posX] FLOAT(53) NOT NULL,
    [posY] FLOAT(53) NOT NULL,
    [rotation] FLOAT(53) NOT NULL CONSTRAINT [VenueTable_rotation_df] DEFAULT 0,
    CONSTRAINT [VenueTable_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Booking_vendorId_eventDate_idx] ON [dbo].[Booking]([vendorId], [eventDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Booking_weddingId_idx] ON [dbo].[Booking]([weddingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Guest_weddingId_idx] ON [dbo].[Guest]([weddingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Guest_tableId_idx] ON [dbo].[Guest]([tableId]);

-- AddForeignKey
ALTER TABLE [dbo].[VendorProfile] ADD CONSTRAINT [VendorProfile_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[VendorImage] ADD CONSTRAINT [VendorImage_vendorId_fkey] FOREIGN KEY ([vendorId]) REFERENCES [dbo].[VendorProfile]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[VendorPackage] ADD CONSTRAINT [VendorPackage_vendorId_fkey] FOREIGN KEY ([vendorId]) REFERENCES [dbo].[VendorProfile]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Booking] ADD CONSTRAINT [Booking_weddingId_fkey] FOREIGN KEY ([weddingId]) REFERENCES [dbo].[Wedding]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Booking] ADD CONSTRAINT [Booking_vendorId_fkey] FOREIGN KEY ([vendorId]) REFERENCES [dbo].[VendorProfile]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Booking] ADD CONSTRAINT [Booking_packageId_fkey] FOREIGN KEY ([packageId]) REFERENCES [dbo].[VendorPackage]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BlockedDate] ADD CONSTRAINT [BlockedDate_vendorId_fkey] FOREIGN KEY ([vendorId]) REFERENCES [dbo].[VendorProfile]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Wedding] ADD CONSTRAINT [Wedding_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[BudgetItem] ADD CONSTRAINT [BudgetItem_weddingId_fkey] FOREIGN KEY ([weddingId]) REFERENCES [dbo].[Wedding]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Guest] ADD CONSTRAINT [Guest_weddingId_fkey] FOREIGN KEY ([weddingId]) REFERENCES [dbo].[Wedding]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Guest] ADD CONSTRAINT [Guest_tableId_fkey] FOREIGN KEY ([tableId]) REFERENCES [dbo].[VenueTable]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[VenueTable] ADD CONSTRAINT [VenueTable_weddingId_fkey] FOREIGN KEY ([weddingId]) REFERENCES [dbo].[Wedding]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- WedCraft: un furnizor NU poate avea 2 rezervari CONFIRMED in aceeasi zi (anti double-booking)
CREATE UNIQUE NONCLUSTERED INDEX [Booking_vendor_date_confirmed_unique] ON [dbo].[Booking]([vendorId], [eventDate]) WHERE [status] = 'CONFIRMED';

-- WedCraft: un scaun poate fi ocupat de un singur invitat
CREATE UNIQUE NONCLUSTERED INDEX [Guest_table_seat_unique] ON [dbo].[Guest]([tableId], [seatIndex]) WHERE [tableId] IS NOT NULL AND [seatIndex] IS NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
