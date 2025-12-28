import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject, IsDateString } from 'class-validator';
import { DailyLogType } from '@prisma/client';

export class CreateDailyLogDto {
    @IsString()
    @IsNotEmpty()
    childId: string;

    @IsEnum(DailyLogType)
    type: DailyLogType;

    @IsObject()
    data: Record<string, any>;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsDateString()
    @IsOptional()
    timestamp?: string;
}
