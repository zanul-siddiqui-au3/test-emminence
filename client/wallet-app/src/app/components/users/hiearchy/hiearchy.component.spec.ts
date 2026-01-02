import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HiearchyComponent } from './hiearchy.component';

describe('HiearchyComponent', () => {
  let component: HiearchyComponent;
  let fixture: ComponentFixture<HiearchyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HiearchyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HiearchyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
