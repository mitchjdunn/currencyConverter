window.addEventListener('load', () => {
    const el = $('#app');

    // Compile Handlebar Templates
    const errorTemplate = Handlebars.compile($('#error-template').html());
    const ratesTemplate = Handlebars.compile($('#rates-template').html());
    const exchangeTemplate = Handlebars.compile($('#exchange-template').html());
    const historicalTemplate = Handlebars.compile($('#historical-template').html());

    const router = new Router({
        mode: 'history',
        page404: (path) => {
            const html = errorTemplate({
                color: 'yellow',
                title: '404 -- page not found',
                message: `The path '/${path}' does not exist`,
            });
            el.html(html);
        },

    });

    const api = axios.create({
        baseURL: 'http://localhost:3000/api',
        timeout: 5000,
    });

    //Display Error Banner
    const showError = (error) => {
        // console.log(error);
        const { title, message } = error.response.data;
        const html = errorTemplate({ color: 'red', title, message });
        el.html(html);
    };

    // Display Latest Currency Rates
    router.add('/', async () => {
        let html = ratesTemplate();
        el.html(html);
        try {
            // Load Currency Rate
            const response = await api.get('rates');
            const { base, date, rates } = response.data;

            // Display Rates Table
            html = ratesTemplate({base, date, rates});
            el.html(html);
        } catch (error) {
            showError(error);
        } finally {
            // Remove Loader status
            $('.loading').removeClass('loading');
        }
    });

    // perform POST request, calculate and display conversion results
    const getConversionResults = async () => {
        // Extract form data
        const from = $('#from').val();
        const to = $('#to').val();
        const amount = $('#amount').val();
        // Send post data to Express(proxy) server
        try {
            const response = await api.post('/convert', { from, to });
            const { rate } = response.data;
            const result = rate * amount;
            $('#result').html(`${to} ${result}`)
        }catch (error) {
            showError(error);
        } finally {
            $('#result-segment').removeClass('loading');
        }
    };

    // Handle Convert Button Click Event
    const convertRatesHandler = () => {
        if ($('.ui.form').form('is valid')) {
            // hide error message
            $('.ui.error.message').hide();
            // post to express server
            $('#result-segment').addClass('loading');
            getConversionResults();
            // prevent page from submitting to server
            return false;
        }
        return true;
    };

    router.add('/exchange', async () => {
        let html = exchangeTemplate;
        el.html(html);
        try {
            // load Symbols
            const response = await api.get('/symbols');
            const { symbols } = response.data;
            html = exchangeTemplate({ symbols });
            el.html(html);
            $('.loading').removeClass('loading');
            // Validate Form inputer
            $('.ui.form').form({
                fields: {
                    from: 'empty',
                    to: 'empty',
                    amount: 'decimal',
                }
            });
            // Specify Submit Handler
            $('.submit').click(convertRatesHandler);
        } catch (error) {
            showError(error);
        }
    });

const getHistoricalRates = async () => {
  const date = $('#date').val();
  try {
    const response = await api.post('/historical', { date });
    const { base, rates } = response.data;
    const html = ratesTemplate({ base, date, rates });
    $('#historical-table').html(html);
  } catch (error) {
    showError(error);
  } finally {
    $('.segment').removeClass('loading');
  }
};

const historicalRatesHandler = () => {
  if ($('.ui.form').form('is valid')) {
    // hide error message
    $('.ui.error.message').hide();
    // Indicate loading status
    $('.segment').addClass('loading');
    getHistoricalRates();
    // Prevent page from submitting to server
    return false;
  }
  return true;
};

router.add('/historical', () => {
  // Display form
  const html = historicalTemplate();
  el.html(html);
  // Activate Date Picker
  $('#calendar').calendar({
    type: 'date',
    formatter: { //format date to yyyy-mm-dd
      date: date => new Date(date).toISOString().split('T')[0],
    },
  });
  // Validate Date input
  $('.ui.form').form({
    fields: {
      date: 'empty',
    },
  });
  $('.submit').click(historicalRatesHandler);
});

    // navigate app to current url
    router.navigateTo(window.location.pathname);

    // highight current path in menu
    const link = $(`a[href$='${window.location.pathname}']`);
    link.addClass('active');

    $('a').on('click', event => {
        // prevent broswser to laod
        event.preventDefault();

        //highlight active menu item on click
        const target = $(event.target);
        $('.item').removeClass('active');
        target.addClass('active');

        //navigate to clicked url
        const href = target.attr('href');
        const path = href.substr(href.lastIndexOf('/'));
        router.navigateTo(path);
    });

});
