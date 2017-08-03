import { QbloPage } from './app.po';

describe('qblo App', () => {
  let page: QbloPage;

  beforeEach(() => {
    page = new QbloPage();
  });

  it('should display welcome message', done => {
    page.navigateTo();
    page.getParagraphText()
      .then(msg => expect(msg).toEqual('Welcome to app!!'))
      .then(done, done.fail);
  });
});
