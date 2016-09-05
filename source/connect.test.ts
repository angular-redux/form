import {
  fakeAsync,
  flushMicrotasks,
  inject,
  TestBed,
  ComponentFixtureNoNgZone,
} from '@angular/core/testing';
import {
  Component,
  Input,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  NgForm,
  FormGroup,
} from '@angular/forms';

import {
  Store,
  applyMiddleware,
  compose,
  combineReducers,
  createStore,
} from 'redux';

import {composeReducers} from './compose-reducers';
import {defaultFormReducer} from './form-reducer';
import {provideReduxForms} from './configure';
import {NgReduxForms} from './module';

import {
  logger,
  simulateUserTyping,
} from './tests.utilities';

// This component will be overridden with new selectors and templates
@Component({
  selector: 'none',
  template: '',
})
class TestComponent {}

const createControlFromTemplate = (key: string, template: string) => {
  const config = {
    selector: `test-form-${key}`,
    template,
  };

  TestBed.overrideComponent(TestComponent, {set: config});

  return TestComponent;
};

interface AppState {
  fooState?: FooState;
}

interface FooState {
  example: string;
  deepInside: {
    foo: string;
  }
  bar: string;
  checkExample: boolean;
}

const initialState: FooState = {
  example: 'Test!',
  deepInside: {
    foo: 'Bar!'
  },
  bar: 'two',
  checkExample: true,
};

const testReducer = (state = initialState, action = {type: ''}) => {
  return state;
}

const reducers = composeReducers(
  combineReducers({
    fooState: testReducer
  }),
  defaultFormReducer());

TestBed.configureTestingModule({
  imports: [
    NgReduxForms,
  ],
  declarations: [
    TestComponent,
  ]
});

TestBed.compileComponents();

describe('connect directive', () => {
  let store: Store<AppState>;

  beforeEach(() => {
    const create = compose(applyMiddleware(logger))(createStore);

    store = create(reducers, <AppState> {});

    TestBed.configureCompiler({
      providers: [
        {provide: ComponentFixtureNoNgZone, useValue: true},
        provideReduxForms(store)
      ]
    });
  });

  it('should bind all form controls to application state',
    () => {
      const ConnectComponent = createControlFromTemplate('controlExample', `
        <form connect="fooState">
          <input type="text" name="example" ngControl ngModel />
        </form>
      `);

      return fakeAsync(inject([], () => {
        const fixture = TestBed.createComponent(ConnectComponent);
        fixture.detectChanges();

        flushMicrotasks();

        const textbox = fixture.nativeElement.querySelector('input');
        expect(textbox.value).toEqual('Test!');
      }));
  });

  it('should bind a form control to element deep inside application state',
    () => {
      const DeepConnectComponent = createControlFromTemplate('deepConnectExample', `
        <form connect="fooState.deepInside">
          <input type="text" name="foo" ngControl ngModel />
        </form>
      `);

      return fakeAsync(inject([], () => {
        const fixture = TestBed.createComponent(DeepConnectComponent);
        fixture.detectChanges();

        flushMicrotasks();

        const textbox = fixture.nativeElement.querySelector('input');
        expect(textbox.value).toEqual('Bar!');
      }));
    });

  it('should bind a checkbox to a boolean state',
    () => {
      const CheckboxForm = createControlFromTemplate('checkboxExample', `
        <form connect="fooState">
          <input type="checkbox" name="checkExample" ngControl ngModel />
        </form>
      `);

      return fakeAsync(inject([], () => {
        const fixture = TestBed.createComponent(CheckboxForm);
        fixture.detectChanges();

        flushMicrotasks();

        const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
        expect(checkbox.checked).toEqual(true);
      }));
    });

  it('should bind a select dropdown to application state',
    () => {
      const SelectForm = createControlFromTemplate('selectExample', `
        <form connect="fooState">
          <select name="bar" ngControl ngModel>
            <option value="none">None</option>
            <option value="one">One</option>
            <option value="two">Two</option>
          </select>
        </form>
      `);

      return fakeAsync(inject([], () => {
        const fixture = TestBed.createComponent(SelectForm);
        fixture.detectChanges();

        flushMicrotasks();

        const select = fixture.nativeElement.querySelector('select');
        expect(select.value).toEqual('two');

        // TODO(cbond): How to simulate a click-select sequence on this control?
        // Just updating `value' does not appear to invoke all of the Angular
        // change routines and therefore does not update Redux. But manually clicking
        // and selecting does. Need to find a way to simulate that sequence.
      }));
    });

  it('should update Redux state when the user changes the value of a control',
    () => {
      const UpdateTextValueExample = createControlFromTemplate('updateTextValue', `
        <form connect="fooState">
          <input type="text" name="bar" ngControl ngModel />
        </form>
      `);

      return fakeAsync(inject([], () => {
        const fixture = TestBed.createComponent(UpdateTextValueExample);
        fixture.detectChanges();

        flushMicrotasks();

        // validate initial data before we do the UI tests
        let state = store.getState();
        expect(state.fooState.bar).toEqual('two');

        const textbox = fixture.nativeElement.querySelector('input');
        expect(textbox.value).toEqual('two');

        return simulateUserTyping(textbox, 'abc')
          .then(() => {
            expect(textbox.value).toEqual('twoabc');

            state = store.getState();
            expect(state.fooState.bar).toEqual('twoabc');
          });
      }));
  });
});
