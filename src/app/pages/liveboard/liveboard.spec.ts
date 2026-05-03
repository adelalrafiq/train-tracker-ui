import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Liveboard } from './liveboard';

describe('Liveboard', () => {
  let component: Liveboard;
  let fixture: ComponentFixture<Liveboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Liveboard],
    }).compileComponents();

    fixture = TestBed.createComponent(Liveboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
