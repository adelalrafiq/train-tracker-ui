import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { inject } from '@angular/core';
import { Loading } from '../services/loading';
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(Loading);
  loadingService.show();
  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    })
  );
};
