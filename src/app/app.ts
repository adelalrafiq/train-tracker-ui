import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar'
import { ProgressBar } from './shared/components/progress-bar/progress-bar';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProgressBar, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('train-tracker-ui');
}
