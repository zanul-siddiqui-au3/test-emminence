import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyChildrenComponent } from './my-children.component';

describe('MyChildrenComponent', () => {
  let component: MyChildrenComponent;
  let fixture: ComponentFixture<MyChildrenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyChildrenComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyChildrenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
