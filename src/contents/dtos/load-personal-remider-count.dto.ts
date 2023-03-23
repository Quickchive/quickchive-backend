import { ApiProperty } from '@nestjs/swagger';
import { CoreOutput } from '../../common/dtos/output.dto';

export class LoadReminderCountOutput extends CoreOutput {
  @ApiProperty({
    description: '설정된 리마인더 개수',
  })
  count!: number;
}
