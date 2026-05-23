import { Component, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Loading } from '../../../core/services/loading';

@Component({
  selector: 'app-progress-bar',
  imports: [MatProgressBarModule, NgIf, AsyncPipe],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
})
export class ProgressBar {
  private loadingService = inject(Loading);
  loading$ = this.loadingService.loading$;
}
