import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-topic-banner',
  imports: [],
  templateUrl: './topic-banner.html',
  styleUrl: './topic-banner.scss',
})
export class TopicBanner {
  @Input() badge = 'Dirección de Hidrología';
  @Input() subtitle = '';
  @Input() title = '';
  @Input() description = '';
}
